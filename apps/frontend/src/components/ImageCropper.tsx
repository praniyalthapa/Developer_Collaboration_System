import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { getCroppedImage } from "../lib/cropImage";
import { getErrorMessage } from "../lib/apiClient";

interface ImageCropperProps {
  imageSrc: string;
  saving?: boolean;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}

export const ImageCropper = ({
  imageSrc,
  saving = false,
  onCancel,
  onSave,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState("");

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!areaPixels) return;
    try {
      const blob = await getCroppedImage(imageSrc, areaPixels);
      onSave(blob);
    } catch (cropError) {
      setError(getErrorMessage(cropError, "Could not crop the image"));
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="surface w-full max-w-lg p-5">
        <h3 className="mb-4 text-lg font-semibold">Adjust your photo</h3>
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-base-300">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="range range-primary range-sm mt-4"
        />
        {error ? <p className="mt-2 text-sm text-error">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Uploading..." : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
};
