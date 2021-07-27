import * as React from "react"
import { AppNavBar, setItemActive } from "baseui/app-nav-bar"

export default () => {
  const [mainItems, setMainItems] = React.useState([{ label: "Main A", active: true }])
  return (
    <AppNavBar
      title="Percetta"
      mainItems={mainItems}
      onMainItemSelect={(item) => {
        console.log(item)
        setMainItems((prev) => setItemActive(prev, item))
      }}
    />
  )
}
