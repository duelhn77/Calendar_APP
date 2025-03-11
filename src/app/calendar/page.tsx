"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DateSelectArg } from "@fullcalendar/core";
import { EventData } from "@/types/EventData";
import { Modal } from "@/components/Modal";
import Sidebar from "@/components/Sidebar";

export default function CalendarPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [events, setEvents] = useState([]);

  // ✅ Google Sheets から予定データを取得
  const fetchEventsFromSheets = async () => {
    try {
      const userId = localStorage.getItem("userId") || "";
      if (!userId) {
        console.error("❌ ユーザーIDが取得できませんでした");
        return;
      }

      const response = await fetch(`/api/getEvents?userId=${encodeURIComponent(userId)}`);
      if (!response.ok) throw new Error("スプレッドシートのデータ取得に失敗");

      const data = await response.json();
      console.log("✅ /api/getEvents のレスポンス:", data);

      setEvents(
        data
          .filter((event: EventData) => event.userId === userId) // ✅ ログインユーザーのデータのみ取得
          .map((event: EventData) => ({
            id: event.id, // DataId
            title: `${event.engagement} - ${event.activity}`,
            start: new Date(event.start),
            end: new Date(event.end),
            extendedProps: {
              details: `${event.location} / ${event.details}`,
            },
          }))
      );
    } catch (error) {
      console.error("❌ スプレッドシートからのデータ取得エラー:", error);
    }
  };

  // ✅ 予定をスプレッドシートに保存
  const handleAddEvent = async (data: EventData): Promise<void> => {
    if (!selectedRange) {
      console.error("❌ 選択された範囲がありません！");
      return;
    }

    try {
      const userId = localStorage.getItem("userId") || "";
      const response = await fetch("/api/saveEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent?.id || "",
          userId,
          start: selectedRange.start.toISOString(),
          end: selectedRange.end.toISOString(),
          engagement: data.engagement,
          activity: data.activity,
          location: data.location,
          details: data.details,
        }),
      });

      if (!response.ok) throw new Error("スプレッドシートへの保存に失敗");

      console.log("✅ スプレッドシートに保存完了");
      fetchEventsFromSheets();
      setIsOpen(false);
    } catch (error) {
      console.error("❌ スプレッドシートへの保存エラー:", error);
    }
  };

  // ✅ 予定をスプレッドシートで更新
  const handleUpdateEvent = async (data: EventData, range: { start: Date; end: Date } | null): Promise<void> => {
    if (!range || !selectedEvent) {
      console.error("❌ 更新する範囲またはイベントが未定義です！");
      return;
    }

    try {
      const response = await fetch("/api/updateEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id, // DataId を使用
          start: range.start.toISOString(),
          end: range.end.toISOString(),
          engagement: data.engagement,
          activity: data.activity,
          location: data.location,
          details: data.details,
        }),
      });

      if (!response.ok) throw new Error("スプレッドシートの更新に失敗");

      console.log("✅ スプレッドシートを更新完了");
      fetchEventsFromSheets();
      setIsOpen(false);
    } catch (error) {
      console.error("❌ スプレッドシートの更新エラー:", error);
    }
  };

  // ✅ 予定がクリックされたときにホップアップを表示
  const handleEventClick = (clickInfo: any) => {
    console.log("📅 クリックされたイベント:", clickInfo.event);
  
    setSelectedEvent({
      id: clickInfo.event.id || "",
      userId: clickInfo.event.extendedProps.userId || "", // ✅ `userId` を追加
      engagement: clickInfo.event.title.split(" - ")[0] || "",
      activity: clickInfo.event.title.split(" - ")[1] || "",
      location: clickInfo.event.extendedProps.details.split(" / ")[0] || "",
      details: clickInfo.event.extendedProps.details.split(" / ")[1] || "",
      start: clickInfo.event.start.toISOString(),
      end: clickInfo.event.end?.toISOString() || clickInfo.event.start.toISOString(),
    });
    
  
    setSelectedRange({
      start: clickInfo.event.start,
      end: clickInfo.event.end,
    });
  
    setIsOpen(true);
  };
  
  
  const handleDeleteEvent = async (id: string): Promise<void> => {
    console.log("🗑️ 削除する予定の ID:", id);
  
    try {
      const response = await fetch("/api/deleteEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }), // ✅ ID を送信
      });
  
      if (!response.ok) {
        throw new Error("スプレッドシートの削除に失敗しました");
      }
  
      console.log("✅ スプレッドシートのデータを削除しました！");
      fetchEventsFromSheets(); // ✅ 削除後に最新のデータを取得
      setIsOpen(false);
    } catch (error) {
      console.error("❌ 削除エラー:", error);
    }
  };
  
  const handleEventResize = async (resizeInfo: any) => {
    console.log("✏️ 予定の時間が変更されました:", resizeInfo.event);
  
    const updatedEvent = {
      id: resizeInfo.event.id,
      start: resizeInfo.event.start.toISOString(),
      end: resizeInfo.event.end.toISOString(),
      engagement: resizeInfo.event.title.split(" - ")[0] || "",
      activity: resizeInfo.event.title.split(" - ")[1] || "",
      location: resizeInfo.event.extendedProps.details.split(" / ")[0] || "",
      details: resizeInfo.event.extendedProps.details.split(" / ")[1] || "",
    };
  
    try {
      const response = await fetch("/api/updateEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEvent),
      });
  
      if (!response.ok) {
        throw new Error("スプレッドシートの更新に失敗しました");
      }
  
      console.log("✅ スプレッドシートのデータを更新しました");
      fetchEventsFromSheets(); // 🔹 最新のデータを取得
    } catch (error) {
      console.error("❌ スプレッドシートの更新エラー:", error);
    }
  };
  
  const handleEventMove = async (eventDropInfo: any) => {
    console.log("📌 予定の移動:", eventDropInfo);
  
    const { event } = eventDropInfo;
    const updatedEvent = {
      id: event.id, // ✅ DataId を取得
      start: event.start.toISOString(),
      end: event.end?.toISOString() || event.start.toISOString(), // end がない場合は start と同じに
    };
  
    console.log("✅ 更新するデータ:", updatedEvent);
  
    try {
      const response = await fetch("/api/updateEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEvent),
      });
  
      if (!response.ok) {
        throw new Error("スプレッドシートの更新に失敗");
      }
  
      console.log("✅ スプレッドシート更新完了");
      fetchEventsFromSheets(); // 🔹 更新後、最新の予定を取得
    } catch (error) {
      console.error("❌ スプレッドシートの更新エラー:", error);
    }
  };

  const handleSelect = (arg: DateSelectArg) => {
    console.log("📅 選択された範囲:", arg.start, arg.end);
    setSelectedRange({ start: arg.start, end: arg.end });
    setSelectedEvent(null);
    setIsOpen(true);
  };

  
  // ✅ 初回読み込み時にスプレッドシートのデータを取得
  useEffect(() => {
    if (!localStorage.getItem("isAuthenticated")) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      fetchEventsFromSheets();
    }
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ marginLeft: "220px", padding: "20px", width: "100%" }}>
        <FullCalendar
          plugins={[timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          slotMinTime="06:00:00"
          slotMaxTime="30:00:00"
          locale="ja"
          timeZone="Asia/Tokyo"
          slotDuration="00:15:00"
          slotLabelInterval="01:00:00"
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          selectable={true}
          editable={true}
          select={handleSelect}
          events={events}
          eventClick={handleEventClick}
          eventDrop={handleEventMove}
          eventResize={handleEventResize}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridWeek,timeGridDay",
          }}
        />

        {isOpen && (
          <Modal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            onSubmit={handleAddEvent}
            onUpdate={handleUpdateEvent}
            onDelete={handleDeleteEvent}
            selectedRange={selectedRange}
            selectedEvent={selectedEvent}
          />
        )}
      </div>
    </div>
  );
}
