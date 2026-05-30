import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Fuck IT";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "#666",
            marginBottom: "20px",
          }}
        >
          Fuck IT
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "60px",
            left: "80px",
            fontSize: "22px",
            color: "#444",
          }}
        >
          Anonymous social. No profiles. No bullshit.
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
