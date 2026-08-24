export interface StreamData {
  name: string | null;
  image: string | null;
  mediaId: string | null;
  stream: string | null;
  referer: string;
}

export interface Servers {
  name: string | null;
  dataHash: string | null;
}

export interface RCPResponse {
  metadata: {
    image: string;
  };
  data: string;
}
