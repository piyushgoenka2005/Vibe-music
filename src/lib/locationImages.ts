/** Curated storefront art for the Discover our locations strip. */
const LOCATION_IMAGES: Record<string, string> = {
  delhi: "/images/locations/delhi.jpg",
  kolkata: "/images/locations/kolkata.jpg",
  nagpur: "/images/locations/nagpur.jpg",
  "north-east": "/images/locations/north-east.jpg",
  mumbai: "/images/locations/mumbai.jpg",
};

export function getLocationImage(city: string): string {
  const key = city.trim().toLowerCase().replace(/\s+/g, "-");
  return LOCATION_IMAGES[key] ?? LOCATION_IMAGES.kolkata;
}
