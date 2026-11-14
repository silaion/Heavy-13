// src/utils/cryptoAuth.ts

export const AUTH_STORAGE_KEY = 'heavy13_auth_token_hash';

/**
 * 로컬 개발 환경 폴백 해시 상수 (기본값: "heavy13" 의 SHA-256 해시)
 *
 * [실제 배포 시 환경 변수 설정 안내]
 * - 로컬 `.env.local` 또는 Cloudflare Pages 대시보드(Settings > Environment variables)에
 *   `VITE_APP_PASSCODE_HASH=<원하는 비밀번호의 64자리 소문자 SHA-256 hex 해시>`를 설정하세요.
 * - 코드나 정적 빌드 번들에는 오직 단방향 SHA-256 해시만 포함되며 평문 비밀번호는 절대 노출되지 않습니다.
 */
const DEFAULT_DEV_PASSCODE_HASH =
  '2f7b1f1b58130198014e7805d92544f08d60829755f6b9a282c88565d78e1b6c';

/**
 * 현재 애플리케이션에 설정된 정답 SHA-256 해시값(소문자 64자리 hex)을 반환한다.
 */
export function getTargetPasscodeHash(): string {
  const envHash = import.meta.env.VITE_APP_PASSCODE_HASH;
  if (typeof envHash === 'string' && envHash.trim().length === 64) {
    return envHash.trim().toLowerCase();
  }
  return DEFAULT_DEV_PASSCODE_HASH;
}

/**
 * 브라우저 내장 Web Crypto API (`window.crypto.subtle.digest`)를 사용해
 * 입력된 문자열을 64자리 소문자 16진수(hex) SHA-256 해시 문자열로 변환한다.
 */
export async function hashPassword(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const digestBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  const byteArray = Array.from(new Uint8Array(digestBuffer));
  return byteArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 입력된 비밀번호 평문을 SHA-256 해싱하여 대상 해시값과 일치하는지 검증한다.
 */
export async function verifyPassword(plain: string): Promise<boolean> {
  if (!plain) return false;
  try {
    const hashedInput = await hashPassword(plain);
    const targetHash = getTargetPasscodeHash();
    return hashedInput === targetHash;
  } catch {
    return false;
  }
}

/**
 * 저장소(sessionStorage / localStorage)에 기록된 인증 해시 토큰이
 * 현재 설정된 정답 해시값과 일치하는지 확인한다.
 * (비밀번호 해시가 변경되면 기존 토큰이 자동으로 무효화되어 재인증을 유도함)
 */
export function hasValidAuthToken(): boolean {
  if (typeof window === 'undefined') return false;
  const targetHash = getTargetPasscodeHash();
  try {
    const sessionToken = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionToken === targetHash) return true;
    const localToken = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (localToken === targetHash) return true;
  } catch {
    // 스토리지 접근 차단 시 무시
  }
  return false;
}

/**
 * 검증 완료된 해시 토큰을 저장소에 기록한다.
 */
export function persistAuthToken(): void {
  if (typeof window === 'undefined') return;
  const targetHash = getTargetPasscodeHash();
  try {
    window.sessionStorage.setItem(AUTH_STORAGE_KEY, targetHash);
    window.localStorage.setItem(AUTH_STORAGE_KEY, targetHash);
  } catch {
    // 스토리지 접근 차단 시 무시
  }
}
