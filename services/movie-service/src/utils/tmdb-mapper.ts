// các hàm rút field từ TMDb
export function extractCertification(releaseDates: any): string | null {
  const results = releaseDates?.results || [];
  // ưu tiên US, nếu không có lấy cái đầu
  const target = results.find((r: any) => r.iso_3166_1 === "US") || results[0];
  const cert = target?.release_dates?.find(
    (d: any) => d.certification
  )?.certification;
  return cert || null;
}

export function extractTrailerUrl(videos: any): string | null {
  const items = (videos?.results || []) as any[];
  const yt =
    items.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    items.find((v) => v.site === "YouTube");
  return yt ? `https://www.youtube.com/watch?v=${yt.key}` : null;
}

export function topNames(
  people: any[],
  field: "cast" | "crew",
  role?: string,
  take = 10
): string[] {
  if (field === "cast")
    return (people || []).slice(0, take).map((p: any) => p.name);
  // crew
  const arr = (people || [])
    .filter((c: any) => (role ? c.job === role : true))
    .slice(0, take);
  return arr.map((p: any) => p.name);
}
