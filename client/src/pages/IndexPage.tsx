import React from "react"
import EntitiesList from "../components/EntitiesList"
import RequestForm from "../components/RequestForm"

const IndexPage = () => {
  return (
    <React.Fragment>
      <RequestForm />
      <EntitiesList />
    </React.Fragment>
  )
}

export default IndexPage
