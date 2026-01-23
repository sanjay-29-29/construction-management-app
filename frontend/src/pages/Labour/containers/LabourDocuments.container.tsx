import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Edit, FileText, Loader2, Save, UploadCloud, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';

import { client } from '@/axios';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Labour } from '@/types';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

interface Document {
  file: File;
  preview: string;
  name?: string;
}

export const LabourDocumentsContainer = ({ data }: { data?: Labour }) => {
  const { siteId, labourId } = useParams();
  const queryClient = useQueryClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- MUTATIONS ---

  const uploadDocumentsMutation = useMutation({
    mutationFn: async (newDocuments: Document[]) => {
      const formData = new FormData();
      newDocuments.forEach((doc) => {
        formData.append('documents', doc.file);
      });
      console.log(formData);
      await client.post(`labours/${labourId}/documents/`, formData);
    },
    onSuccess: () => {
      toast.success('Documents uploaded successfully.');
      setDocuments([]);
      setIsEditable(false);
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to upload documents.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  const deleteDocumentsMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await client.delete(`labours/${labourId}/documents/${documentId}/`);
    },
    onSuccess: () => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries({
        queryKey: ['sites', siteId, 'labours', labourId],
      });
      setDocumentToDelete(null);
    },
    onError: (error) => {
      if (isAxiosError(error)) {
        toast.error('Failed to delete document.');
        return;
      }
      toast.error('Unknown error occurred.');
    },
  });

  // --- HANDLERS ---

  const handleUploadSave = () => {
    if (documents.length === 0) return;
    uploadDocumentsMutation.mutate(documents);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: Document[] = [];

    Array.from(files).map((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large. Max size is 5MB.`);
        return;
      }
      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
      });
    });

    setDocuments((prev) => [...prev, ...newImages]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => {
      const targetImage = prev[index];
      if (targetImage) {
        URL.revokeObjectURL(targetImage.preview);
      }
      return prev.filter((_, i) => i !== index);
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    documents.forEach((img) => URL.revokeObjectURL(img.preview));
    setDocuments([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocumentsMutation.mutate(documentToDelete);
    }
  };

  const getFileName = (fileStringOrFile: string | File): string => {
    if (typeof fileStringOrFile === 'string') {
      return fileStringOrFile.split('/').pop() || 'Unknown file';
    }
    return fileStringOrFile.name;
  };

  return (
    <div className="space-y-4">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Documents</h3>
        {!isEditable && (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setIsEditable(true)}
          >
            <span>
              <Edit className="h-4 w-4 mr-2" />
            </span>
            Edit
          </Button>
        )}

        {/* If upload is open, show Save/Cancel buttons */}
        {isEditable && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                handleCancel();
                setIsEditable(false);
              }}
              disabled={uploadDocumentsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleUploadSave}
              disabled={
                documents.length === 0 || uploadDocumentsMutation.isPending
              }
            >
              {uploadDocumentsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* --- 1. EXISTING DOCUMENTS GRID --- */}
      {data?.documents && data.documents.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          {data.documents.map((doc) => (
            <div
              key={doc.id}
              className="relative group border rounded-lg p-4 flex flex-col items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 transition-colors aspect-[4/3] cursor-pointer"
              onClick={() => window.open(doc.document, '_blank')}
            >
              {/* File Icon */}
              <FileText className="h-10 w-10 text-blue-500" />

              {/* Filename */}
              <span className="text-xs text-gray-700 text-center w-full truncate px-2 font-medium">
                {getFileName(doc.fileName)}
              </span>

              {/* Delete Button (Overlay) */}
              {isEditable && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute top-1 right-1 h-7 w-7 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocumentToDelete(doc.id);
                  }}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isEditable && (
          <div className="text-center text-muted-foreground mb-28">
            No documents found.
          </div>
        )
      )}

      {/* --- 2. UPLOAD SECTION --- */}
      {isEditable && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50/50"
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload or drag & drop documents
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PDF, DOCX, XLSX, TXT supported
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* --- 3. PREVIEW OF PENDING UPLOADS --- */}
          {documents.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {documents.map((fileObj, index) => (
                <div
                  key={index}
                  className="relative group border rounded-lg p-3 flex flex-col items-center justify-center gap-2 w-32 shrink-0 aspect-3/4 bg-white shadow-sm"
                >
                  <FileText className="h-8 w-8 text-gray-400" />

                  <span className="text-[10px] text-gray-600 text-center w-full break-all line-clamp-2 leading-tight">
                    {fileObj.name}
                  </span>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute top-0 -right-2 h-6 w-6 rounded-full text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 bg-white shadow-sm z-10"
                    onClick={() => removeDocument(index)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={!!documentToDelete}
        onOpenChange={(open) => !open && setDocumentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDocumentsMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteDocumentsMutation.isPending}
              type="button"
              onClick={(e: FormEvent<HTMLButtonElement>) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {deleteDocumentsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
