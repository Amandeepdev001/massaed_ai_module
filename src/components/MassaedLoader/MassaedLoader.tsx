import Lottie from 'lottie-react'

import loadingAnimation from '@/assets/massaed-loading.json'
import styles from './MassaedLoader.module.css'

export function MassaedLoader() {
  return (
    <div className={styles['massaed-loader']} role="status" aria-label="Loading">
      <Lottie animationData={loadingAnimation} loop className={styles['massaed-loader__animation']} />
    </div>
  )
}

