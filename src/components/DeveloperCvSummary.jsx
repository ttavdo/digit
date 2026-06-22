import { formatExperienceCategories, formatExperienceYears } from '../utils/developerProfile'
import './DeveloperCv.css'

function DeveloperCvSummary({ profile }) {
  if (!profile) return null

  return (
    <div className="dev-cv-summary">
      {profile.bio && <p className="dev-cv-summary__bio">{profile.bio}</p>}
      <dl className="dev-cv-summary__meta">
        <div>
          <dt>გამოცდილება</dt>
          <dd>{formatExperienceYears(profile.experienceYears)}</dd>
        </div>
        <div>
          <dt>კატეგორიები</dt>
          <dd>{formatExperienceCategories(profile.experienceCategories)}</dd>
        </div>
      </dl>
    </div>
  )
}

export default DeveloperCvSummary
