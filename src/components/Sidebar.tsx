import { useState,useEffect } from "react";
import { FaCog } from "react-icons/fa";
import { useRouter } from "next/navigation";
import ExportModal from "./ExportModal";

export default function Sidebar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      try {
        const response = await fetch(`/api/getUserRole?userId=${userId}`);
        const data = await response.json();

        if (data.role) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("❌ ユーザー役職の取得エラー:", error);
      }
    };

    fetchUserRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    router.push("/login");
  };

  const handleExport = async (startDate: string, endDate: string, format: string) => {
    console.log(`📥 エクスポート開始: ${startDate} ～ ${endDate}, フォーマット: ${format}`);
  
    try {
      const response = await fetch("/api/exportData", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, format }) // ✅ `format` を確実に送信
      });
  
      if (!response.ok) throw new Error("エクスポート処理に失敗しました");
  
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `export.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      console.log("✅ エクスポート成功！");
  
    } catch (error) {
      console.error("❌ エクスポートエラー:", error);
    }
  };
  
  

  return (
    <div className="sidebar">
      <h1 className="sidebar-title">Haleiwaシステム</h1>

      <ul>
        <li>🚀未実装</li>
        <li>🚀未実装</li>
        <li>🚀未実装</li>
      </ul>
      
      


      {isExportOpen && (
        <ExportModal 
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          onExport={handleExport}
        />
      )}
    

      <div className="settings" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <FaCog size={20} />
        <span>管理メニュー</span>
      </div>

      {isMenuOpen && (
        <div className="menu-popup">
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>

          {/* 🔹 管理者のみエクスポートボタンを表示 */}
          {userRole === "管理者" && (
           <button
             className="export-button"
             onClick={() => setIsExportOpen(true)}style={{ marginTop: "10px" }}>
             📤 Export
           </button>
          )}
        </div>
      )}
    </div>
  );
}

