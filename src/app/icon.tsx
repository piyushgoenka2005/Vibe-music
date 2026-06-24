import { ImageResponse } from "next/og";
import { getBrandLogoDataUrl } from "@/lib/brandFavicon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const logo = await getBrandLogoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        <img
          src={logo}
          alt=""
          style={{
            height: "168%",
            marginLeft: "-4%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    size
  );
}
