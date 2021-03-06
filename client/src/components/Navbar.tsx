import * as React from "react"
import { AppNavBar, NavItemT, setItemActive } from "baseui/app-nav-bar"
import { Link, useHistory } from "react-router-dom"
import { useAppContext } from "../context/AppContext"

import "./Navbar.scss"
import { USER_IS_LOGGING_OUT } from "../events"

export default () => {
  const context = useAppContext()
  const history = useHistory()

  const [selectedItem, setSelectedItem] = React.useState<NavItemT>()
  const [authenticatedItems, setAuthenticatedItems] = React.useState([
    { label: "Entities", info: "/", active: false },
    { label: "Feeds", info: "/feeds", active: false },
    { label: "Settings", info: "/settings", active: false },
    { label: "Logout", info: () => PubSub.publish(USER_IS_LOGGING_OUT), active: false },
  ] as NavItemT[])

  const [publicItems, setPublicItems] = React.useState([{ label: "Login", info: "/login" }] as NavItemT[])

  // Set active item on page load
  React.useEffect(() => {
    if (selectedItem) return

    for (const item of authenticatedItems) {
      if (history.location.pathname === item.info) {
        setSelectedItem(item)
        setAuthenticatedItems((prev) => setItemActive(prev, item))
        return
      }
    }

    for (const item of publicItems) {
      if (history.location.pathname === item.info) {
        setSelectedItem(item)
        setPublicItems((prev) => setItemActive(prev, item))
      }
    }
  }, [history])

  return (
    <div className="Navbar">
      <AppNavBar
        title={
          <Link to="/">
            <img className="logo" src="/logo-light.png" alt="Downplay" />
          </Link>
        }
        mainItems={context.token ? authenticatedItems : publicItems}
        onMainItemSelect={(item) => {
          if (selectedItem != item) {
            if (typeof item.info === "function") {
              item.info.apply(null)
            } else {
              history.push(item.info)
              setSelectedItem(item)
              setAuthenticatedItems((prev) => setItemActive(prev, item))
            }
          }
        }}
      />
    </div>
  )
}
