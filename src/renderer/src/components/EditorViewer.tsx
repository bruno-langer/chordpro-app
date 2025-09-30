import { useState, useEffect, useCallback } from 'react';
import Editor from './Editor';

import { Song } from '../types';

interface EditorViewProps {
    songId: string;
    initialContent: string;
    onSave: (content: string) => Promise<void>;
    onClose: () => void;
}

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    console.log('debounce');
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

export default function EditorView({
    initialContent,
    onSave,
    onClose
}: EditorViewProps) {
    const [rawContent, setRawContent] = useState(initialContent);
    const [isTyping, setIsTyping] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    // Parse com debounce de 300ms
    const debouncedParse = useCallback(
        debounce((content: string) => {
            try {
                console.log('debounce end')
                onSave(content);
                setParseError(null);
                setIsTyping(false);
            } catch (error: any) {
                console.error('Parse error:', error);
                setParseError(error.message || 'Invalid ChordPro format');
                setIsTyping(false);
            }
        }, 300),
        []
    );

    // Handle change do editor
    const handleEditorChange = (newContent: string) => {
        setRawContent(newContent);
        setHasUnsavedChanges(newContent !== initialContent);
        setIsTyping(true);
        debouncedParse(newContent);
    };

    // Save handler
    const handleSave = async () => {
        if (!hasUnsavedChanges) return;

        setIsSaving(true);
        try {
            await onSave(rawContent);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Failed to save song');
        } finally {
            setIsSaving(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + S para salvar
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
            // Esc para fechar
            if (e.key === 'Escape') {
                if (hasUnsavedChanges) {
                    if (confirm('You have unsaved changes. Close anyway?')) {
                        onClose();
                    }
                } else {
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasUnsavedChanges, rawContent]);

    return (<>
        
            {/* Parse error banner */}
            {parseError && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="font-semibold">Parse Error</p>
                        <p className="text-sm">{parseError}</p>
                    </div>
                </div>
            )}

            {/* Editor + Preview Split */}
                    <div className="flex-1 overflow-hidden">
                        <Editor
                            content={rawContent}
                            onChange={handleEditorChange}
                        />
                    </div>
    </>

    );
}