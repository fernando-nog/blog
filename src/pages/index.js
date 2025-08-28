import * as React from "react"
import LandingPage from "../components/landing-page"
import Seo from "../components/seo"

const HomePage = () => {
  return (
    <>
      <Seo 
        title="Fernando Nogueira - Tech Lead & Software Engineer" 
        meta={[
          {
            name: "msvalidate.01",
            content: "527715A695666B798E1D18C3FD66E418"
          },
          {
            name: "google-site-verification",
            content: "ALlOLnq78qnmghuLq694BDWmPNqOfQTTTvf42ufWNNw"
          }
        ]}
      />
      <LandingPage />
    </>
  )
}

export default HomePage
