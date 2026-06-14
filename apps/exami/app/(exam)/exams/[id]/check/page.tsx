"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { sessionsApi } from "@/lib/api/sessions";
import { useExam } from "@/lib/hooks/queries";
import { StudentTopbar } from "@/components/shared/student-topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingBlock, Spinner } from "@/components/ui/misc";
import { getDeviceToken } from "@/lib/utils";
import { toast } from "@/lib/store/toast";
import { Camera, Wifi, Monitor, Maximize, CheckCircle2, XCircle } from "lucide-react";

type CheckState = "pending" | "ok" | "fail";

export default function SystemCheck() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: exam, isLoading } = useExam(id);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [camera, setCamera] = useState<CheckState>("pending");
  // Browser & network are derived synchronously via lazy initial state.
  const [network] = useState<CheckState>(() =>
    typeof navigator !== "undefined" && navigator.onLine ? "ok" : "fail",
  );
  const [browser] = useState<CheckState>(() =>
    typeof navigator !== "undefined" &&
    "mediaDevices" in navigator &&
    typeof window !== "undefined" &&
    "WebSocket" in window
      ? "ok"
      : "fail",
  );
  const [fullscreen, setFullscreen] = useState<CheckState>("pending");

  useEffect(() => {
    // Camera requires an async permission prompt — done here, not in render.
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCamera("ok");
      })
      .catch(() => setCamera("fail"));

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setFullscreen("ok");
    } catch {
      setFullscreen("fail");
    }
  };

  const precheck = useMutation({
    mutationFn: () =>
      sessionsApi.precheck(id, {
        cameraGranted: camera === "ok",
        networkOk: network === "ok",
        browserCompatible: browser === "ok",
      }),
    onError: (e: Error) => toast.error("Cannot start", e.message),
  });

  const start = useMutation({
    mutationFn: () => sessionsApi.start(id, getDeviceToken()),
    onSuccess: (res) => {
      // Stash the start payload for the runner to pick up.
      sessionStorage.setItem(`exami.start.${id}`, JSON.stringify(res));
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push(`/exam/${id}`);
    },
    onError: (e: Error) => toast.error("Start failed", e.message),
  });

  const begin = async () => {
    const res = await precheck.mutateAsync();
    if (!res.examLive) {
      toast.warning("Exam is not live yet");
      return;
    }
    if (res.cameraRequired && !res.cameraGranted) {
      toast.error("Camera permission required");
      return;
    }
    start.mutate();
  };

  if (isLoading || !exam) return <LoadingBlock />;

  const allOk =
    camera === "ok" &&
    network === "ok" &&
    browser === "ok" &&
    fullscreen === "ok";

  const items = [
    { id: "camera", label: "Camera", icon: <Camera className="h-5 w-5" />, state: camera },
    { id: "network", label: "Network", icon: <Wifi className="h-5 w-5" />, state: network },
    { id: "browser", label: "Browser", icon: <Monitor className="h-5 w-5" />, state: browser },
  ];

  return (
    <div>
      <StudentTopbar />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <PageHeader title="System check" subtitle={exam.title} />

        <Card className="mb-4">
          <CardContent className="pt-5">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="mb-4 aspect-video w-full rounded-lg bg-black object-cover"
            />

            <div className="space-y-2">
              {items.map((it) => (
                <CheckRow
                  key={it.id}
                  label={it.label}
                  icon={it.icon}
                  state={it.state}
                />
              ))}
              <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
                <div className="flex items-center gap-3">
                  <Maximize className="h-5 w-5" />
                  <span className="font-medium">Fullscreen</span>
                </div>
                {fullscreen === "ok" ? (
                  <CheckMark state="ok" />
                ) : (
                  <Button size="sm" variant="outline" onClick={enterFullscreen}>
                    Enter fullscreen
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          disabled={!allOk}
          loading={precheck.isPending || start.isPending}
          onClick={begin}
        >
          {allOk ? "Start exam" : "Complete all checks to start"}
        </Button>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  icon,
  state,
}: {
  label: string;
  icon: React.ReactNode;
  state: CheckState;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <CheckMark state={state} />
    </div>
  );
}

function CheckMark({ state }: { state: CheckState }) {
  if (state === "pending") return <Spinner className="h-4 w-4" />;
  return state === "ok" ? (
    <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
  ) : (
    <XCircle className="h-5 w-5 text-[var(--color-danger)]" />
  );
}
