/** 환경변수 읽기. 비어 있으면 어디를 채워야 하는지 알려주는 에러를 낸다. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} 환경변수가 비어 있습니다. .env.local(로컬) 또는 Vercel Project Settings(배포)에 값을 넣어주세요. 값 받는 방법은 SETUP.md 참고.`);
  }
  return v;
}

export function publicSupabaseEnv() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}
