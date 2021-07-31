import React from "react"
import { Redirect, Route } from "react-router-dom"
import { useAppContext } from "../context/AppContext"

const PrivateRoute = (props: any) => {
  let context = useAppContext()
  return (
    <Route
      {...props.rest}
      render={({ location }) =>
        context.token ? (
          props.children
        ) : (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: location },
            }}
          />
        )
      }
    />
  )
}

export default PrivateRoute
