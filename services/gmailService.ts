
// Dịch vụ xử lý kết nối Gmail API

const GAPI_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

// 1. Khởi tạo Client (Cần gọi hàm này khi App load hoặc khi user nhập API Key)
export const initializeGapiClient = async (apiKey: string, clientId: string) => {
  if (!apiKey || !clientId) throw new Error("Missing API Key or Client ID");

  return new Promise<void>((resolve, reject) => {
    const gapi = (window as any).gapi;
    const google = (window as any).google;

    if (!gapi || !google) {
        reject("Google Scripts not loaded");
        return;
    }

    gapi.load('client', async () => {
      try {
        await gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: [GAPI_DISCOVERY_DOC],
        });
        gapiInited = true;
        
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: '', // defined later
        });
        gisInited = true;
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};

// 2. Yêu cầu đăng nhập & cấp quyền
export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject("Token Client not initialized");

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      } else {
        resolve();
      }
    };

    if ((window as any).gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      tokenClient.requestAccessToken({prompt: ''});
    }
  });
};

// 3. Lấy danh sách email (Tìm kiếm theo query)
export const listEmails = async (query: string = 'subject:(hóa đơn OR invoice)') => {
    const gapi = (window as any).gapi;
    try {
        const response = await gapi.client.gmail.users.messages.list({
            'userId': 'me',
            'q': query,
            'maxResults': 10
        });
        return response.result.messages || [];
    } catch (err) {
        console.error("Error listing emails", err);
        throw err;
    }
}

// 4. Lấy nội dung chi tiết 1 email
export const getEmailDetails = async (messageId: string) => {
    const gapi = (window as any).gapi;
    try {
        const response = await gapi.client.gmail.users.messages.get({
            'userId': 'me',
            'id': messageId
        });
        return response.result;
    } catch (err) {
        console.error("Error getting email details", err);
        throw err;
    }
}

// 5. Giải mã Body Email (Base64Url -> Text)
export const getBodyFromEmail = (message: any): string => {
    let body = '';
    
    const getPartBody = (part: any) => {
        if (part.body && part.body.data) {
            return part.body.data;
        }
        return '';
    }

    if (message.payload) {
        if (message.payload.parts) {
            // Multipart message
            message.payload.parts.forEach((part: any) => {
                if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
                    body += getPartBody(part);
                }
            });
        } else {
            // Single part
            body = getPartBody(message.payload);
        }
    }
    
    // Decode Base64Url
    if (body) {
        try {
            return decodeURIComponent(escape(window.atob(body.replace(/-/g, '+').replace(/_/g, '/'))));
        } catch(e) {
            console.error("Decode error", e);
            return body; // Return raw if fail
        }
    }
    return '';
}

export const getHeader = (headers: any[], name: string) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
}
