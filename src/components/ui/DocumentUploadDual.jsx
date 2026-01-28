import React, { useState, useRef } from 'react';
import { uploadApi } from '../../api/client';
import { Camera, Upload, X, Check, RefreshCw, ImageIcon } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { getImageUrl } from '../../utils/image';

/**
 * DocumentUploadDual - Component for capturing front and back images of identity documents
 * Supports camera capture and file upload for both sides
 */
const DocumentUploadDual = ({
    label,
    docType, // 'pan' | 'aadhar' | 'license' | 'rc'
    numberValue = '',
    onNumberChange,
    numberPlaceholder = 'Enter document number',
    frontUrl = null,
    backUrl = null,
    onFrontUpload,
    onBackUpload,
    icon: IconComponent
}) => {
    return (
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
            {/* Header with icon and label */}
            <div className="flex items-center gap-2">
                {IconComponent && <IconComponent size={18} className="text-primary" />}
                <span className="font-medium text-foreground">{label}</span>
            </div>

            {/* Document Number Input */}
            <Input
                value={numberValue}
                onChange={onNumberChange}
                placeholder={numberPlaceholder}
                className="font-mono uppercase"
            />

            {/* Front and Back Upload Sections */}
            <div className="grid grid-cols-2 gap-3">
                <SingleSideUpload
                    label="Front"
                    docType={docType}
                    side="front"
                    existingUrl={frontUrl}
                    onUpload={onFrontUpload}
                />
                <SingleSideUpload
                    label="Back"
                    docType={docType}
                    side="back"
                    existingUrl={backUrl}
                    onUpload={onBackUpload}
                />
            </div>
        </div>
    );
};

/**
 * SingleSideUpload - Handles upload for one side (front or back) of a document
 */
const SingleSideUpload = ({
    label,
    docType,
    side,
    existingUrl = null,
    onUpload
}) => {
    const [preview, setPreview] = useState(existingUrl);
    const [uploading, setUploading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);

    // Sync preview with external prop changes
    React.useEffect(() => {
        setPreview(existingUrl);
    }, [existingUrl]);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Start camera
    const startCamera = async () => {
        try {
            setCameraActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Camera access error:', err);
            alert('Unable to access camera. Please check permissions or use file upload.');
            setCameraActive(false);
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
                    // Name the file to avoid "blocked" network requests for generic "_blob" URLs
                    const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

                    // Create immediate preview
                    const objectUrl = URL.createObjectURL(file);
                    setPreview(objectUrl);

                    await uploadToServer(file, objectUrl);
                }
            }, 'image/jpeg', 0.8);
            stopCamera();
        }
    };

    // Handle file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Create immediate preview
            const objectUrl = URL.createObjectURL(file);
            setPreview(objectUrl);

            // Upload
            await uploadToServer(file, objectUrl);
        }
    };

    // Upload to Server
    const uploadToServer = async (fileOrBlob, temporaryPreviewUrl) => {
        try {
            setUploading(true);

            const response = await uploadApi.uploadFile(fileOrBlob);
            const publicUrl = response.url;

            // Clean up temporary preview if it was a blob URL
            if (temporaryPreviewUrl && temporaryPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(temporaryPreviewUrl);
            }

            setPreview(publicUrl);
            onUpload(publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document: ' + (error.response?.data?.error || error.message));

            // Revert preview on error
            if (temporaryPreviewUrl && temporaryPreviewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(temporaryPreviewUrl);
            }
            setPreview(existingUrl); // Go back to existing or null
        } finally {
            setUploading(false);
        }
    };

    // Remove uploaded document
    const removeDocument = () => {
        setPreview(null);
        onUpload(null);
    };

    return (
        <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
            </span>

            {/* Preview Mode */}
            {preview && !cameraActive && (
                <div className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-[4/3]">
                    <img
                        src={getImageUrl(preview)}
                        alt={`${docType} ${side}`}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                            type="button"
                            onClick={() => window.open(getImageUrl(preview), '_blank')}
                            /* ... */
                            className="p-1.5 bg-white/90 rounded-md text-gray-700 hover:bg-white text-xs"
                            title="Open Image"
                        >
                            <ImageIcon size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setPreview(null);
                                startCamera();
                            }}
                            className="p-1.5 bg-white/90 rounded-md text-gray-700 hover:bg-white text-xs"
                        >
                            <RefreshCw size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={removeDocument}
                            className="p-1.5 bg-red-500/90 rounded-md text-white hover:bg-red-500 text-xs"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5">
                        <Check size={10} />
                    </div>
                </div>
            )}

            {/* Camera Mode */}
            {cameraActive && (
                <div className="relative rounded-lg overflow-hidden border border-border aspect-[4/3]">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover bg-black"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-1 left-0 right-0 flex justify-center gap-1">
                        <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-2 py-1 bg-white text-black rounded text-xs font-medium"
                        >
                            Capture
                        </button>
                        <button
                            type="button"
                            onClick={stopCamera}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-xs"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Initial State - Upload Options */}
            {!preview && !cameraActive && (
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={uploading}
                        className="flex-1 flex flex-col items-center justify-center gap-1 p-2 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary aspect-[4/3]"
                    >
                        <Camera size={16} />
                        <span className="text-[10px]">Camera</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex-1 flex flex-col items-center justify-center gap-1 p-2 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary aspect-[4/3]"
                    >
                        <Upload size={16} />
                        <span className="text-[10px]">{uploading ? '...' : 'Upload'}</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
};

export default DocumentUploadDual;
