import Lottie from 'lottie-react'

import loadingAnimation from '@/assets/massaed-loading.json'

export function MassaedLoader() {
  return (
    <div className="massaed-loader" role="status" aria-label="Loading">
      <Lottie animationData={loadingAnimation} loop className="massaed-loader__animation" />
    </div>
  )
}
