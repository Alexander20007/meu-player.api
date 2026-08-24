export function decrypt(param: string, type: string): string | null {
  try {
    if (type === "LXVUMCoAHJ") {
      const reversed = param.split("").reverse().join("");
      const base64 = reversed.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = atob(base64);
      let result = "";
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) - 3);
      }
      return result;
    }
    return null;
  } catch {
    return null;
  }
}
