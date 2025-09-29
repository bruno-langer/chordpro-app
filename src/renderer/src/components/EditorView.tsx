import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'

function Editor({ content, onChange }) {
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString())
          }
        })
      ]
    })

    const view = new EditorView({
      state,
      parent: editorRef?.current
    })

    return () => view.destroy()
  }, [])

  return <div ref={editorRef} />
}

export default Editor