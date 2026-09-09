import { TemplateLibrary } from '../../components/shared/TemplateLibrary'
export default function MyTemplates() {
  return (
    <>
      <div className="workspace-page-header">
        <div>
          <h1>Template library</h1>
          <p>A starting point for every kind of business.</p>
        </div>
      </div>
      <TemplateLibrary privateLibrary />
    </>
  )
}
