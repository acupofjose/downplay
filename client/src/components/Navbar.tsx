import * as React from "react"
import { AppNavBar, setItemActive } from "baseui/app-nav-bar"

export default () => {
  const [mainItems, setMainItems] = React.useState([
    { label: "Entities", active: true },
    { label: "Feeds" },
    { label: "Settings" },
  ])
  return (
    <AppNavBar
      title="Percetta"
      mainItems={mainItems}
      onMainItemSelect={(item) => {
        console.log(item)
      }}
    />
  )
}
