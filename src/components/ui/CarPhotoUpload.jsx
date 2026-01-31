import React, { useState, useRef } from 'react';
import { uploadApi } from '../../api/client';
import { Camera, Upload, X, Plus, Car } from 'lucide-react';

/**
 * CarPhotoUpload - Component for capturing multiple car photos
 * Supports camera capture and file upload with grid preview
 */
const CarPhotoUpload = ({
    photos = [],
    onPhotosChange,
    maxPhotos = 6
}) => {
    const [uploading, setUploading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Start camera with better mobile handling
    const startCamera = async () => {
        // Check if getUserMedia is available (requires HTTPS or localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            // Fallback: trigger file input with camera capture
            if (fileInputRef.current) {
                fileInputRef.current.click();
            }
            return;
        }

        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setCameraActive(false);

            // On mobile, if camera access fails, trigger file picker with camera capture attribute
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            } else {
                alert('Unable to access camera. Please check permissions or use file upload.');
            }
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    };

    // Capture photo from camera
    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            canvas.toBlob(async (blob) => {
                if (blob) {
                    await uploadToServer(blob);
                }
            }, 'image/jpeg', 0.8);
            stopCamera();
        }
    };

    // Handle file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadToServer(file);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload to Server
    const uploadToServer = async (fileOrBlob) => {
        try {
            setUploading(true);

            const response = await uploadApi.uploadFile(fileOrBlob);
            const publicUrl = response.url; // Corrected access

            // Add to photos array
            onPhotosChange([...photos, publicUrl]);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload photo: ' + (error.response?.data?.error || error.message));
        } finally {
            setUploading(false);
        }
    };

    // Remove photo
    const removePhoto = (index) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };

    const canAddMore = photos.length < maxPhotos;

    return (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Car size={18} className="text-primary" />
                    <span className="font-medium text-foreground">Car Photos</span>
                </div>
                <span className="text-xs text-muted-foreground">
                    {photos.length}/{maxPhotos}
                </span>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-2">
                {/* Existing Photos */}
                {photos.map((url, index) => (
                    <div
                        key={index}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                    >
                        <img
                            src={url}
                            alt={`Car photo ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500/90 rounded-full text-white hover:bg-red-500"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}

                {/* Camera Active */}
                {cameraActive && (
                    <div className="aspect-square rounded-lg overflow-hidden border border-border col-span-3">
                        <div className="relative w-full h-full">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover bg-black"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="px-3 py-1.5 bg-white text-black rounded-md text-sm font-medium"
                                >
                                    Capture
                                </button>
                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Photo Button */}
                {canAddMore && !cameraActive && (
                    <div className="aspect-square flex gap-1">
                        <button
                            type="button"
                            onClick={startCamera}
                            disabled={uploading}
                            className="flex-1 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                        >
                            <Camera size={16} />
                            <span className="text-[9px]">Camera</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex-1 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
                        >
                            <Upload size={16} />
                            <span className="text-[9px]">{uploading ? '...' : 'Upload'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Helper text */}
            <p className="text-xs text-muted-foreground">
                📸 Capture photos of the car before handover (front, back, sides, dashboard)
            </p>
        </div>
    );
};

export default CarPhotoUpload;
