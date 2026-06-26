import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearUser, setUser } from "../features/userSlice";
import {
  deleteAccount,
  updateProfile,
  uploadProfilePhoto,
} from "../api/profile.api";
import { getErrorMessage } from "../lib/apiClient";
import { UserCard } from "../components/UserCard";
import { SkillsInput } from "../components/SkillsInput";
import { ImageCropper } from "../components/ImageCropper";
import { Avatar } from "../components/Avatar";
import { PageHeader } from "../components/PageHeader";
import type { Gender } from "../types/models";

const GENDERS: Gender[] = ["male", "female", "other"];

const Profile = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : "");
  const [gender, setGender] = useState<Gender | "">(user?.gender ?? "");
  const [about, setAbout] = useState(user?.about ?? "");
  const [skills, setSkills] = useState<string[]>(user?.skills ?? []);
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl ?? "");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUploadCropped = async (blob: Blob) => {
    setUploading(true);
    setError("");
    try {
      const updated = await uploadProfilePhoto(blob);
      dispatch(setUser(updated));
      setPhotoUrl(updated.photoUrl);
      setSelectedImage(null);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Photo upload failed"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const updated = await updateProfile({
        firstName,
        lastName,
        about,
        skills,
        photoUrl,
        gender: gender || undefined,
        age: age ? Number(age) : undefined,
      });
      dispatch(setUser(updated));
      setSaved(true);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      dispatch(clearUser());
      navigate("/login", { replace: true });
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Could not delete your account"));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <PageHeader
        icon="user"
        eyebrow="Your profile"
        title="Edit profile"
        description="This is how other developers see you. Keep it sharp."
      />
      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
      <div className="flex justify-center lg:sticky lg:top-28 lg:self-start">
        <UserCard
          user={{
            _id: user._id,
            firstName,
            lastName,
            photoUrl,
            about,
            age: age ? Number(age) : undefined,
            gender: gender || undefined,
            skills,
          }}
          showActions={false}
        />
      </div>

      <div className="surface gradient-border p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <Avatar
            firstName={firstName}
            lastName={lastName}
            photoUrl={photoUrl}
            size="w-20 h-20"
            textSize="text-2xl"
          />
          <label className="btn btn-outline btn-sm">
            {uploading ? "Uploading..." : "Change photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control">
            <span className="label-text mb-1 font-medium">First name</span>
            <input
              className="input input-bordered"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 font-medium">Last name</span>
            <input
              className="input input-bordered"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 font-medium">Age</span>
            <input
              type="number"
              min={18}
              className="input input-bordered"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
          </label>
          <label className="form-control">
            <span className="label-text mb-1 font-medium">Gender</span>
            <select
              className="select select-bordered"
              value={gender}
              onChange={(event) => setGender(event.target.value as Gender | "")}
            >
              <option value="">Prefer not to say</option>
              {GENDERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4">
          <SkillsInput skills={skills} onChange={setSkills} />
        </div>

        <label className="form-control mt-4">
          <span className="label-text mb-1 font-medium">
            About ({about.length}/600)
          </span>
          <textarea
            className="textarea textarea-bordered h-28"
            maxLength={600}
            value={about}
            onChange={(event) => setAbout(event.target.value)}
          />
        </label>

        {error ? (
          <div className="alert alert-error mt-4 py-2 text-sm">
            <span>{error}</span>
          </div>
        ) : null}
        {saved ? (
          <div className="alert alert-success mt-4 py-2 text-sm">
            <span>Profile saved.</span>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
          <button
            type="button"
            className="btn btn-error btn-outline"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            Delete account
          </button>
        </div>
      </div>

      {selectedImage ? (
        <ImageCropper
          imageSrc={selectedImage}
          saving={uploading}
          onCancel={() => setSelectedImage(null)}
          onSave={handleUploadCropped}
        />
      ) : null}

      {showDeleteConfirm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
          <div className="surface w-full max-w-sm p-6 text-center">
            <h3 className="text-lg font-semibold text-error">Delete account?</h3>
            <p className="mt-2 text-sm text-base-content/60">
              This permanently removes your profile, connections, and messages.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <button type="button" className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-error" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      </div>
    </>
  );
};

export default Profile;
