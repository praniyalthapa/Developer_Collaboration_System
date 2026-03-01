import React, { useState } from "react";
import UserCard from "./UserCard";
import Avatar from "./Avatar";
import ImageCropper from "./ImageCropper";
import SkillsInput from "./SkillsInput";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { useNavigate } from "react-router-dom";

const getFullPhotoUrl = (url) => {
  if (!url) return null;
  // If url is already absolute, return as-is
  if (url.startsWith("http")) return url;
  // Prepend backend origin (replace 7777 with your backend port)
  return `http://localhost:7777${url}`;
};


const EditProfile = ({ user }) => {
	const [firstName, setFirstname] = useState(user.firstName);
	const [lastName, setLastName] = useState(user.lastName);
	const [photoURL, setPhotoURL] = useState(user.photoUrl);
	const [age, setAge] = useState(user.age || "");
	const [gender, setGender] = useState(user.gender);
	const [about, setAbout] = useState(user.about);
	const [skills, setSkills] = useState(user.skills || []);
	const [error, setError] = useState("");
	const [showToast, setShowToast] = useState(false);

	const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const dispatch = useDispatch();
	const navigate = useNavigate();

	const [showCropper, setShowCropper] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);

	// Upload photo - prevent page refresh
	const handleFileChange = (e) => {
		e.preventDefault();
		const file = e.target.files && e.target.files[0];
		if (!file) return;
		const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
		if (!allowed.includes(file.type)) {
			setError("Only JPG, PNG, WEBP, GIF allowed");
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			setSelectedImage(reader.result);
			setShowCropper(true);
		};
		reader.readAsDataURL(file);
	};

	// Upload cropped image to backend
	// const uploadCropped = async (croppedImageBlob) => {
	// 	setIsUploadingPhoto(true);
	// 	try {
	// 		const form = new FormData();
	// 		form.append("photo", croppedImageBlob, "profile.jpg");

	// 		const res = await axios.post(`${BASE_URL}/upload/profile-photo`, form, {
	// 			withCredentials: true,
	// 			headers: { "Content-Type": "multipart/form-data" },
	// 		});

	// 		dispatch(addUser(res.data.data));
	// 		setPhotoURL(res.data.data.photoUrl);
	// 		setShowCropper(false);
	// 		setSelectedImage(null);

	// 		setShowToast(true);
	// 		setTimeout(() => setShowToast(false), 3000);
	// 	} catch (err) {
	// 		setError(err?.response?.data?.message || "Upload failed");
	// 	} finally {
	// 		setIsUploadingPhoto(false);
	// 	}
	// };
	const uploadCropped = async (croppedImageBlob) => {
  setIsUploadingPhoto(true);
  try {
    const form = new FormData();
    form.append("photo", croppedImageBlob, "profile.jpg");

    const res = await axios.post(`${BASE_URL}/upload/profile-photo`, form, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });

    dispatch(addUser(res.data.data));

    // Use relative backend path
    let newPhotoUrl = res.data.data.photoUrl;
    if (newPhotoUrl.startsWith("/api/uploads/")) {
      newPhotoUrl = `${window.location.protocol}//${window.location.hostname}:7777${newPhotoUrl}`;
    }

    //setPhotoURL(newPhotoUrl); // <-- this will now show immediately
	setPhotoURL(res.data.data.photoUrl);

    setShowCropper(false);
    setSelectedImage(null);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  } catch (err) {
    setError(err?.response?.data?.message || "Upload failed");
  } finally {
    setIsUploadingPhoto(false);
  }
};


	// Save profile
	const saveProfile = async () => {
		setError("");
		setIsSaving(true);
		try {
			const res = await axios.patch(
				BASE_URL + "/profile/edit",
				{ firstName, lastName, photoUrl: photoURL, age, gender, about, skills },
				{ withCredentials: true }
			);

			dispatch(addUser(res.data.data));

			setShowToast(true);
			setTimeout(() => setShowToast(false), 3000);
		} catch (error) {
			setError(error.response?.data || "Save failed");
		} finally {
			setIsSaving(false);
		}
	};

	// Delete account
	const deleteAccount = async () => {
		setIsDeleting(true);
		try {
			await axios.delete(BASE_URL + "/profile/delete", { withCredentials: true });

			dispatch(addUser(null));
			setShowToast(true);
			setTimeout(() => setShowToast(false), 3000);

			navigate("/login");
		} catch (err) {
			setError(err?.response?.data?.message || "Delete failed");
		} finally {
			setIsDeleting(false);
			setShowDeleteConfirm(false);
		}
	};

	return (
		<>
			<div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200">
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-7xl mx-auto">
						{/* Headers Section */}
						<div className="flex flex-col lg:flex-row gap-8 mb-8">
							<div className="lg:w-1/3 flex justify-center">
								<h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
									Live Preview
								</h2>
							</div>
							<div className="lg:w-2/3 flex justify-center">
								<h2 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
									Edit Profile
								</h2>
							</div>
						</div>

						{/* Content Section */}
						<div className="flex flex-col lg:flex-row gap-8">
							{/* Live Preview - LEFT */}
							<div className="lg:w-1/3 flex justify-center">
								<div className="w-full max-w-sm lg:sticky lg:top-20 lg:self-start">
									<UserCard
										user={{
											_id: "preview",
											firstName,
											lastName,
											photoUrl: photoURL,
											about,
											age,
											gender,
											skills,
										}}
										showActions={false}
									/>
								</div>
							</div>

							{/* Edit Form - RIGHT */}
							<div className="lg:w-2/3">
								<div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
									<div className="card-body">
										{/* Profile Picture */}
										<div className="text-center mb-8">
											<div className="relative inline-block">
												<Avatar
													firstName={firstName}
													lastName={lastName}
													photoUrl={photoURL}
													size="w-32 h-32"
													textSize="text-4xl"
													className="border-4 border-primary shadow-lg hover:shadow-xl transition-all duration-300"
												/>

												{/* File input */}
												<label className="absolute bottom-0 right-0 btn btn-circle btn-primary btn-sm shadow-lg cursor-pointer hover:scale-110 transition-transform">
													{isUploadingPhoto ? (
														<div className="loading loading-spinner loading-xs"></div>
													) : (
														<svg
															xmlns="http://www.w3.org/2000/svg"
															className="h-4 w-4"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
															/>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth="2"
																d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
															/>
														</svg>
													)}
													<input
														type="file"
														accept="image/*"
														onChange={handleFileChange}
														onClick={(e) => e.stopPropagation()}
														className="hidden"
														disabled={isUploadingPhoto}
													/>
												</label>
											</div>
											<p className="text-sm text-base-content/70 mt-2">
												Click the camera icon to upload a new photo
											</p>
										</div>

										{/* Form Inputs */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<label className="form-control">
												<div className="label">
													<span className="label-text font-medium">First Name</span>
												</div>
												<input
													type="text"
													value={firstName}
													onChange={(e) => setFirstname(e.target.value)}
													className="input input-bordered input-primary focus:input-primary w-full"
													placeholder="Enter your first name"
												/>
											</label>

											<label className="form-control">
												<div className="label">
													<span className="label-text font-medium">Last Name</span>
												</div>
												<input
													type="text"
													value={lastName}
													onChange={(e) => setLastName(e.target.value)}
													className="input input-bordered input-primary focus:input-primary w-full"
													placeholder="Enter your last name"
												/>
											</label>

											<label className="form-control">
												<div className="label">
													<span className="label-text font-medium">Age</span>
												</div>
												<input
													type="number"
													value={age}
													onChange={(e) => setAge(e.target.value)}
													className="input input-bordered input-primary focus:input-primary w-full"
													placeholder="Enter your age"
													min="18"
													max="100"
												/>
											</label>

											<label className="form-control">
												<div className="label">
													<span className="label-text font-medium">Gender</span>
												</div>
												<select
													value={gender}
													onChange={(e) => setGender(e.target.value)}
													className="select select-bordered select-primary focus:select-primary w-full"
												>
													<option value="">Select gender</option>
													<option value="male">Male</option>
													<option value="female">Female</option>
													<option value="other">Other</option>
												</select>
											</label>
										</div>

										{/* Skills */}
										<div className="mt-6">
											<SkillsInput skills={skills} onSkillsChange={setSkills} />
										</div>

										{/* About */}
										<label className="form-control mt-6">
											<div className="label">
												<span className="label-text font-medium">About</span>
												<span className="label-text-alt">{about.length}/500 characters</span>
											</div>
											<textarea
												value={about}
												onChange={(e) => setAbout(e.target.value)}
												className="textarea textarea-bordered textarea-primary focus:textarea-primary w-full h-32 resize-none"
												placeholder="Tell us about yourself..."
												maxLength="500"
											/>
										</label>

										{/* Error Message */}
										{error && (
											<div className="alert alert-error mt-6">
												<span>{error}</span>
											</div>
										)}

										{/* Buttons */}
										<div className="card-actions justify-center mt-8 flex gap-4">
											<button
												className="btn btn-primary btn-lg px-12"
												onClick={saveProfile}
												disabled={isSaving}
											>
												{isSaving ? "Saving..." : "Save Profile"}
											</button>

											<button
												className="btn btn-error btn-lg px-6"
												onClick={() => setShowDeleteConfirm(true)}
												disabled={isDeleting}
											>
												{isDeleting ? "Deleting..." : "Delete Account"}
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Image Cropper */}
			{showCropper && (
				<ImageCropper
					imageSrc={selectedImage}
					onCancel={() => setShowCropper(false)}
					onSave={uploadCropped}
				/>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteConfirm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-base-100 p-6 rounded-xl shadow-xl w-96 text-center">
						<h3 className="text-xl font-bold text-error">Delete Account?</h3>
						<p className="mt-2 text-sm text-gray-500">
							This action cannot be undone. Your account will be permanently deleted.
						</p>
						<div className="flex justify-center gap-4 mt-6">
							<button className="btn" onClick={() => setShowDeleteConfirm(false)}>
								Cancel
							</button>
							<button className="btn btn-error" onClick={deleteAccount}>
								Yes, Delete
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Success Toast */}
			{showToast && (
				<div className="toast toast-top toast-center z-50">
					<div className="alert alert-success shadow-lg">
						<span>Action completed successfully!</span>
					</div>
				</div>
			)}
		</>
	);
};

export default EditProfile;
