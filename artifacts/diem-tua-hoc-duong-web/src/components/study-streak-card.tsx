import { useUser } from "@clerk/react";
import {
  getGetStudyStreakQueryKey,
  useCheckInStudyDay,
  useGetStudyStreak,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, Check, Flame, RotateCw } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StudyStreakCard() {
  const { isLoaded, isSignedIn } = useUser();
  const queryClient = useQueryClient();
  const streakQuery = useGetStudyStreak({
    query: {
      queryKey: getGetStudyStreakQueryKey(),
      enabled: Boolean(isSignedIn),
    },
  });
  const checkInMutation = useCheckInStudyDay({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: getGetStudyStreakQueryKey(),
        }),
    },
  });

  return (
    <section className="bg-[#f4f8fd] py-10 md:py-12">
      <div className="container mx-auto max-w-5xl px-4">
        <Card className="overflow-hidden border-[#dce7f5] bg-white shadow-sm">
          <CardContent className="flex flex-col gap-6 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1fb] text-[#193765]">
                <Flame className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#42618c]">Thói quen học tập</p>
                <h2 className="mt-1 text-xl font-bold text-[#193765] sm:text-2xl">
                  Chuỗi học tập
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Học một chút mỗi ngày và đánh dấu hoàn thành để duy trì nhịp học.
                </p>
              </div>
            </div>

            {!isLoaded ? (
              <div className="flex gap-4">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-10 w-40 self-center" />
              </div>
            ) : !isSignedIn ? (
              <div className="flex flex-col gap-3 md:max-w-xs md:items-end">
                <p className="text-sm leading-6 text-muted-foreground md:text-right">
                  Đăng nhập Google để lưu streak vào tài khoản và tiếp tục trên thiết bị khác.
                </p>
                <Link href="/sign-in">
                  <Button className="w-full gap-2 bg-[#193765] hover:bg-[#254b80] md:w-auto">
                    Đăng nhập Google
                  </Button>
                </Link>
              </div>
            ) : streakQuery.isLoading ? (
              <div className="flex gap-4">
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-16 w-24" />
                <Skeleton className="h-10 w-40 self-center" />
              </div>
            ) : streakQuery.isError ? (
              <div className="flex flex-col gap-3 md:items-end">
                <p className="text-sm text-destructive" role="status">
                  Chưa tải được chuỗi học tập. Hãy thử lại.
                </p>
                <Button
                  variant="outline"
                  className="gap-2 border-[#193765]/20 text-[#193765]"
                  onClick={() => void streakQuery.refetch()}
                >
                  <RotateCw className="h-4 w-4" aria-hidden="true" />
                  Thử lại
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <div className="min-w-24 rounded-xl bg-[#f6f8fc] px-4 py-3 text-center">
                    <p className="text-2xl font-bold tabular-nums text-[#193765]">
                      {streakQuery.data?.currentStreak ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">ngày liên tiếp</p>
                  </div>
                  <div className="min-w-24 rounded-xl bg-[#f6f8fc] px-4 py-3 text-center">
                    <p className="text-2xl font-bold tabular-nums text-[#193765]">
                      {streakQuery.data?.totalStudyDays ?? 0}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">ngày đã học</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    className="gap-2 bg-[#193765] hover:bg-[#254b80]"
                    disabled={
                      Boolean(streakQuery.data?.checkedInToday) ||
                      checkInMutation.isPending
                    }
                    onClick={() => checkInMutation.mutate()}
                  >
                    {streakQuery.data?.checkedInToday ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    {checkInMutation.isPending
                      ? "Đang lưu..."
                      : streakQuery.data?.checkedInToday
                        ? "Đã đánh dấu hôm nay"
                        : "Đánh dấu đã học"}
                  </Button>
                  {checkInMutation.isError && (
                    <p className="text-xs text-destructive" role="status">
                      Chưa lưu được. Vui lòng thử lại.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
