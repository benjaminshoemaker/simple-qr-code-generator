"use client";

import { useState, useEffect } from "react";

interface Tag {
  id: string;
  name: string;
}

interface TagInputProps {
  qrCodeId: string;
  initialTags?: Tag[];
}

export function TagInput({ qrCodeId, initialTags = [] }: TagInputProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load available tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const response = await fetch("/api/tags");
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    };
    loadTags();
  }, []);

  // Load QR code's current tags
  useEffect(() => {
    const loadQrTags = async () => {
      try {
        const response = await fetch(`/api/qr/${qrCodeId}/tags`);
        if (response.ok) {
          const data = await response.json();
          setTags(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load QR tags:", err);
      }
    };
    if (initialTags.length === 0) {
      loadQrTags();
    }
  }, [qrCodeId, initialTags.length]);

  const handleAddTag = async (tag: Tag) => {
    setError(null);

    try {
      const response = await fetch(`/api/qr/${qrCodeId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId: tag.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          // Tag already added, just update local state
          setTags((prev) => [...prev, tag]);
        } else {
          setError(data.error || "Failed to add tag");
        }
        return;
      }

      setTags((prev) => [...prev, tag]);
    } catch {
      setError("An unexpected error occurred");
    }

    setIsOpen(false);
  };

  const handleRemoveTag = async (tagId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/qr/${qrCodeId}/tags/${tagId}`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        const data = await response.json();
        setError(data.error || "Failed to remove tag");
        return;
      }

      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch {
      setError("An unexpected error occurred");
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    setError(null);

    try {
      // Create the tag
      const createResponse = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json();
        setError(data.error || "Failed to create tag");
        return;
      }

      const newTag = await createResponse.json();

      // Add to available tags
      setAvailableTags((prev) => [...prev, newTag]);

      // Add to QR code
      await handleAddTag(newTag);

      setNewTagName("");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  // Filter out already-added tags
  const filteredTags = availableTags.filter(
    (tag) => !tags.some((t) => t.id === tag.id)
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>

      {error && (
        <p className="text-xs text-red-600 mb-2">{error}</p>
      )}

      {/* Current tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="hover:text-blue-900"
              title="Remove tag"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Add tag button */}
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1 px-2 py-1 border border-dashed border-gray-300 text-gray-500 text-sm rounded-full hover:border-gray-400 hover:text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add tag
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              {filteredTags.length > 0 && (
                <div className="p-2 max-h-40 overflow-y-auto">
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddTag(tag)}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-700 rounded hover:bg-gray-100"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-100 p-2">
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag..."
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateTag();
                      }
                    }}
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTagName.trim() || isCreating}
                    className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isCreating ? "..." : "+"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click away to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
