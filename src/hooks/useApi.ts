import ky, { type KyInstance } from 'ky';
import type { AuthConfig, SendMessageRequest, SendMessageResponse, GetMessagesResponse, LinkPreviewResponse } from '../types';

let apiClient: KyInstance;

export function initApi(baseUrl: string, auth?: AuthConfig): void {
  apiClient = ky.create({
    prefixUrl: baseUrl,
    timeout: 30000,
    retry: 2,
    hooks: {
      beforeRequest: [
        async (request) => {
          if (auth?.token) {
            const token = typeof auth.token === 'function' ? await auth.token() : auth.token;
            request.headers.set(auth.headerName || 'Authorization', `Bearer ${token}`);
          }
        }
      ]
    }
  });
}

export async function sendMessage(data: SendMessageRequest): Promise<SendMessageResponse> {
  return apiClient.post('messages', { json: data }).json();
}

export async function getMessages(cursor?: string): Promise<GetMessagesResponse> {
  const searchParams = cursor ? { cursor } : {};
  return apiClient.get('messages', { searchParams }).json();
}

export async function getLinkPreview(url: string): Promise<LinkPreviewResponse> {
  return apiClient.get('link-preview', { searchParams: { url } }).json();
}

export { apiClient };
