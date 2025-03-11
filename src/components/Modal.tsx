"use client";
import { useState, useEffect } from "react";
import { EventData } from "@/types/EventData"; // ✅ `EventData` を正しくインポート
import Select from "react-select";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventData) => Promise<void>;
  onUpdate: (data: EventData, range: { start: Date; end: Date } | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>; // ✅ 削除用の関数を追加
  selectedRange?: { start: Date; end: Date } | null;
  selectedEvent?: EventData | null;
}

interface Engagement {
  id: string;
  name: string;
}

export function Modal({ isOpen, onClose, onSubmit, onUpdate, onDelete, selectedRange, selectedEvent }: ModalProps) {
  const [engagement, setEngagement] = useState<{ value: string; label: string } | null>(null);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [activity, setActivity] = useState("");
  const [activities, setActivities] = useState<{ engagement: string; activity_id: string; activity: string }[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<{ activity_id: string; activity: string }[]>([]);
  const [location, setLocation] = useState<{ value: string; label: string } | null>(null);
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [details, setDetails] = useState("");

  // ✅ エンゲージメントリストの取得
  useEffect(() => {
    const fetchEngagements = async () => {
      try {
        const response = await fetch("/api/fetchEngagements");
        const data = await response.json();
        console.log("✅ エンゲージメントリスト:", data);

        const formattedEngagements = data.map((eng: { id?: string; name: string }, index: number) => ({
          id: eng.id || index.toString(),
          name: eng.name,
        }));

        setEngagements(formattedEngagements);
      } catch (error) {
        console.error("❌ エンゲージメントの取得エラー:", error);
      }
    };

    if (isOpen) {
      fetchEngagements();
    }
  }, [isOpen]);


// ✅ Activities を取得
useEffect(() => {
  const fetchActivities = async () => {
    try {
      const response = await fetch("/api/fetchActivities");
      const data = await response.json();
      console.log("✅ Activity データ:", data);
      setActivities(data);
    } catch (error) {
      console.error("❌ Activity の取得エラー:", error);
    }
  };

  if (isOpen) {
    fetchActivities();
  }
}, [isOpen]);

// ✅ Engagement に応じた Activity をフィルタリング
useEffect(() => {
  const filtered = activities.filter(act => act.engagement === engagement?.value);

  setFilteredActivities(filtered);
}, [engagement, activities]);
  

  // ✅ `selectedEvent` のデータをセット
  useEffect(() => {
    if (selectedEvent) {
      console.log("📌 選択されたイベント:", selectedEvent);
      setEngagement(selectedEvent.engagement ? { value: selectedEvent.engagement, label: selectedEvent.engagement } : null);
      setActivity(selectedEvent.activity || "");
      setLocation(selectedEvent.location ? { value: selectedEvent.location, label: selectedEvent.location } : null);
      setDetails(selectedEvent.details || "");
    } else {
      // 新規作成時のデフォルト値
      setEngagement(null);
      setActivity("");
      setLocation(null);
      setDetails("");
    }
  }, [selectedEvent, engagements]);

  // 🔹 作業場所リストの取得
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/fetchLocations");
        const data = await response.json();
        console.log("✅ 取得した作業場所:", data);
        setLocations(data);
      } catch (error) {
        console.error("❌ 作業場所の取得エラー:", error);
      }
    };

    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h1>作業情報を入力</h1>
        {selectedRange && (
          <p>
            📅 {selectedRange.start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} 
            ～ {selectedRange.end.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

         {/* エンゲージメント選択 */}
        <div style={{ marginBottom: "10px" }}>
          <label>エンゲージメント</label><br />
          <Select
            options={engagements.map(eng => ({
            value: eng.name,
            label: eng.name
            }))}
            value={engagement}
            onChange={(selectedOption) => setEngagement(selectedOption)}
            styles={{
              menuList: (provided) => ({
                ...provided,
                maxHeight: "200px", // 最大5つまで表示
                overflowY: "auto",
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999, // 前面に表示
              })
            }}
            placeholder="エンゲージメントを選択"
          />

        </div >


        {/* Activity の選択 (react-select) */}
        <div style={{ marginBottom: "10px" }}>
        <label>Activity</label><br />
        <Select
          options={filteredActivities.map(act => ({
            value: act.activity_id, // activity_id を value に設定
            label: act.activity     // 表示されるラベル
          }))}
          value={filteredActivities.find(act => act.activity === activity) 
            ? { value: activity, label: activity } 
            : null}
          onChange={(selectedOption) => setActivity(selectedOption?.label || "")}
          styles={{
            menuList: (provided) => ({
              ...provided,
              maxHeight: "200px", // 5つまで表示
              overflowY: "auto",
            }),
            menu: (provided) => ({
              ...provided,
              zIndex: 9999, // 他の要素より前面に表示
            })
          }}
          placeholder="Activityを選択"
        />
        </div>    

        <label>作業場所</label>
        <Select
            options={locations}
            value={location} // ✅ location の型を `{ value: string; label: string } | null` に統一
            onChange={(selectedOption) => setLocation(selectedOption)} // ✅ そのままセット
            placeholder="作業場所を選択"
            styles={{
              menuList: (provided) => ({
                ...provided,
                maxHeight: "200px", // 最大5つまで表示
                overflowY: "auto",
              }),
              menu: (provided) => ({
                ...provided,
                zIndex: 9999, // 前面に表示
              }),
            }}
        />


        <label style={{ display: "block", marginTop:"14px",marginBottom: "-15px" }}>
          作業内容
        </label>
        
        <input
           type="text"
           value={details}
           onChange={(e) => setDetails(e.target.value)}
           style={{
             paddingTop: "5px", // 🔹 文字を少し下にずらす
             paddingBottom: "5px",
             height: "30px", // ✅ 適度な高さを設定
          }}
        />        
        <button
          onClick={() => {
          console.log("✅ 追加・更新ボタンが押されました！");

        if (selectedEvent) {
         if (!selectedRange) {
          console.error("❌ 更新範囲が未定義です！");
         return;
         }
    
         onUpdate({
          id: selectedEvent?.id || "", // ✅ `id` をセット
          userId: localStorage.getItem("userId") || "", // ✅ `userId` をセット
          engagement: engagement?.value ?? "",
          activity,
          location: location?.value || "",
          details,
          start: selectedRange?.start.toISOString() || "", // ✅ `start` をセット
          end: selectedRange?.end.toISOString() || "" // ✅ `end` をセット
        },selectedRange);
        } else {
         onSubmit({
          id: "", // ✅ 新規作成時は `id` なし
          userId: localStorage.getItem("userId") || "", // ✅ `userId` をセット
          engagement: engagement?.value ?? "",
          activity,
          location: location?.value || "",
          details,
          start: selectedRange?.start.toISOString() || "", // ✅ `start` をセット
          end: selectedRange?.end.toISOString() || "" // ✅ `end` をセット
        });
        }
        }}>

          {selectedEvent ? "更新" : "追加"}
        </button>


{/* ✅ 予定があるときのみ「削除」ボタンを表示 */}
{selectedEvent && (
  <button
    onClick={async () => {
      console.log("🗑️ 削除ボタンが押されました！");
      await onDelete(selectedEvent.id); // ✅ `selectedEvent.id` を渡す

    }}
    style={{ backgroundColor: "red", color: "white", marginLeft: "10px" }}
  >削除</button>
)}

        <button onClick={onClose}>キャンセル</button>
      </div>
    </div>
  );
}
