import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";

interface Props {
  isVisible: boolean;
  onBarCodeScanned: (data: string) => void;
  onClose: () => void;
  title?: string;
}

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
};

async function openCamera(): Promise<MediaStream> {
  let stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: { facingMode: { ideal: "environment" }, ...VIDEO_CONSTRAINTS },
  });

  // Sau khi có quyền, nhãn thiết bị mới đọc được.
  // Nếu bị chọn nhầm ống kính "Ultra Wide" (iPhone) thì đổi sang ống kính chính.
  const label = stream.getVideoTracks()[0].label;
  if (/ultra/i.test(label)) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const main = devices.find(
      (d) =>
        d.kind === "videoinput" &&
        /back|rear|sau/i.test(d.label) &&
        !/ultra/i.test(d.label),
    );
    if (main) {
      stream.getTracks().forEach((t) => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: main.deviceId }, ...VIDEO_CONSTRAINTS },
      });
    }
  }
  return stream;
}

async function createDetector() {
  const Native = (window as any).BarcodeDetector;
  if (Native) return new Native({ formats: ["code_128"] });
  // Safari / iOS: dùng polyfill
  const { BarcodeDetector } = await import("barcode-detector/ponyfill");
  return new BarcodeDetector({ formats: ["code_128"] });
}

export const BarcodeScanner: React.FC<Props> = ({
  isVisible,
  onBarCodeScanned,
  onClose,
  title = "Quét mã vạch",
}) => (
  <Modal visible={isVisible} animationType="fade" onRequestClose={onClose}>
    {isVisible && (
      <WebScanner
        onBarCodeScanned={onBarCodeScanned}
        onClose={onClose}
        title={title}
      />
    )}
  </Modal>
);

const WebScanner = ({
  onBarCodeScanned,
  onClose,
  title,
}: Omit<Props, "isVisible">) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canZoom, setCanZoom] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    (async () => {
      try {
        stream = await openCamera();
        const track = stream.getVideoTracks()[0];
        trackRef.current = track;

        const caps: any = track.getCapabilities?.() ?? {};
        // Android Chrome: bật lấy nét liên tục
        if (caps.focusMode?.includes?.("continuous")) {
          await track
            .applyConstraints({
              advanced: [{ focusMode: "continuous" } as any],
            })
            .catch(() => {});
        }
        // Android Chrome: có zoom thì hiện nút zoom
        if (caps.zoom) setCanZoom(true);

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const detector = await createDetector();

        const tick = async () => {
          if (stopped) return;
          try {
            if (video.readyState >= 2) {
              const codes = await detector.detect(video);
              if (codes.length) {
                stopped = true;
                onBarCodeScanned(codes[0].rawValue);
                return;
              }
            }
          } catch {}
          timer = setTimeout(tick, 120); // ~8 lần/giây, đủ nhanh và nhẹ cho iPhone
        };
        tick();
      } catch (e: any) {
        setError(
          e?.name === "NotAllowedError"
            ? "Chưa cấp quyền camera cho trình duyệt"
            : (e?.message ?? "Không thể mở camera"),
        );
      }
    })();

    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Chạm vào hình để lấy nét lại (chỉ có tác dụng trên máy hỗ trợ)
  const refocus = useCallback(async () => {
    const track = trackRef.current;
    const caps: any = track?.getCapabilities?.() ?? {};
    if (!track || !caps.focusMode) return;
    try {
      if (caps.focusMode.includes("single-shot")) {
        await track.applyConstraints({
          advanced: [{ focusMode: "single-shot" } as any],
        });
      }
      if (caps.focusMode.includes("continuous")) {
        await track.applyConstraints({
          advanced: [{ focusMode: "continuous" } as any],
        });
      }
    } catch {}
  }, []);

  const toggleZoom = async () => {
    const track = trackRef.current;
    const caps: any = track?.getCapabilities?.() ?? {};
    if (!track || !caps.zoom) return;
    const next = !zoomed;
    const value = next ? Math.min(2, caps.zoom.max) : caps.zoom.min;
    try {
      await track.applyConstraints({ advanced: [{ zoom: value } as any] });
      setZoomed(next);
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* @ts-ignore: thẻ DOM, chỉ chạy trên web */}
      <video
        ref={videoRef}
        onClick={refocus}
        playsInline
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Top bar */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 44,
            height: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 20 }}>✕</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "#FFF",
            fontSize: 18,
            fontWeight: "700",
            flex: 1,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Khung quét */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: "80%",
            maxWidth: 480,
            aspectRatio: 5 / 3,
            borderWidth: 2,
            borderColor: "#f10e0e",
            borderRadius: 20,
          }}
        />
        <Text
          style={{
            color: "#FFF",
            marginTop: 16,
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
          }}
        >
          Hướng camera vào mã vạch Code 128
        </Text>
      </View>

      {/* Nút zoom (chỉ hiện khi thiết bị hỗ trợ) */}
      {canZoom && (
        <TouchableOpacity
          onPress={toggleZoom}
          style={{
            position: "absolute",
            bottom: 48,
            alignSelf: "center",
            backgroundColor: "#f10e0e",
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "700" }}>
            {zoomed ? "Zoom 1x" : "Zoom 2x"}
          </Text>
        </TouchableOpacity>
      )}

      {error && (
        <Text
          style={{
            position: "absolute",
            bottom: 110,
            alignSelf: "center",
            color: "#FFF",
            textAlign: "center",
            paddingHorizontal: 24,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};
