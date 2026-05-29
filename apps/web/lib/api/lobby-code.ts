const LOBBY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateLobbyCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += LOBBY_ALPHABET.charAt(Math.floor(Math.random() * LOBBY_ALPHABET.length));
  }
  return out;
}
