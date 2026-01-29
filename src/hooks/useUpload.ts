import { useState, useCallback, useRef } from 'preact/hooks';
import Uppy from '@uppy/core';
import XHRUpload from '@uppy/xhr-upload';
import type { UploadConfig, UploadResponse, AuthConfig } from '../types';

interface UseUploadOptions {
  config: Required<UploadConfig>;
  apiUrl: string;
  auth?: AuthConfig;
  onUploadComplete: (files: UploadResponse[]) => void;
  onError: (error: Error) => void;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  files: File[];
}

export function useUpload({ config, apiUrl, auth, onUploadComplete, onError }: UseUploadOptions) {
  const [state, setState] = useState<UploadState>({ isUploading: false, progress: 0, files: [] });
  const uppyRef = useRef<Uppy | null>(null);

  const initUppy = useCallback(() => {
    if (uppyRef.current) return uppyRef.current;

    const uppy = new Uppy({
      restrictions: {
        maxFileSize: config.maxFileSize,
        maxNumberOfFiles: config.maxFiles,
        allowedFileTypes: config.allowedTypes
      },
      autoProceed: false
    });

    uppy.use(XHRUpload, {
      endpoint: `${apiUrl}${config.endpoint}`,
      fieldName: 'file',
      headers: auth?.token ? { [auth.headerName || 'Authorization']: `Bearer ${typeof auth.token === 'function' ? '' : auth.token}` } : {}
    });

    uppy.on('upload-progress', (file, progress) => {
      const total = progress.bytesTotal || 1;
      setState(prev => ({ ...prev, progress: (progress.bytesUploaded / total) * 100 }));
    });

    uppy.on('complete', (result) => {
      const uploaded = result.successful?.map(file => (file.response?.body || {}) as unknown as UploadResponse).filter(f => f.id) || [];
      setState({ isUploading: false, progress: 0, files: [] });
      onUploadComplete(uploaded);
      uppy.cancelAll();
    });

    uppy.on('error', (error) => {
      setState({ isUploading: false, progress: 0, files: [] });
      onError(error);
    });

    uppyRef.current = uppy;
    return uppy;
  }, [config, apiUrl, auth, onUploadComplete, onError]);

  const addFiles = useCallback((files: File[]) => {
    const uppy = initUppy();
    files.forEach(file => {
      try { uppy.addFile({ name: file.name, type: file.type, data: file }); } catch (e) {}
    });
    setState(prev => ({ ...prev, files: [...prev.files, ...files] }));
  }, [initUppy]);

  const removeFile = useCallback((index: number) => {
    const uppy = uppyRef.current;
    if (uppy) {
      const files = uppy.getFiles();
      if (files[index]) uppy.removeFile(files[index].id);
    }
    setState(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== index) }));
  }, []);

  const upload = useCallback(async () => {
    const uppy = uppyRef.current;
    if (!uppy || uppy.getFiles().length === 0) return;
    setState(prev => ({ ...prev, isUploading: true }));
    await uppy.upload();
  }, []);

  const clear = useCallback(() => {
    uppyRef.current?.cancelAll();
    setState({ isUploading: false, progress: 0, files: [] });
  }, []);

  return { state, actions: { addFiles, removeFile, upload, clear } };
}
