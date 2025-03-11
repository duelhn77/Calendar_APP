import React, { useState } from "react";
import Select from "react-select";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: string, endDate: string, format: string) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("xlsx");

  if (!isOpen) return null;

  return (
    <>
      {/* ✅ オーバーレイを適用 */}
      <div className="export-modal-overlay" onClick={onClose}></div>

      {/* ✅ モーダル本体 */}
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <h2>📥 データをエクスポート</h2>

        <label>開始日</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

        <label>終了日</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <label>ファイル形式</label>
        <Select
          options={[
            { value: "xlsx", label: "Excel (.xlsx)" },
            { value: "csv", label: "CSV (.csv)" }
          ]}
          styles={{
            menuList: (provided) => ({
              ...provided,
              maxHeight: "150px", // リストの最大高さ
            }),
          }}
        />


        <div className="export-modal-buttons">
          <button className="export-button" onClick={() => onExport(startDate, endDate, format)}>📤 エクスポート</button>
          <button className="export-button cancel" onClick={onClose}>キャンセル</button>
        </div>
      </div>
    </>
  );
};

export default ExportModal;
