import { Block } from "baseui/block"
import { Button } from "baseui/button"
import { Card, StyledBody } from "baseui/card"
import { FlexGrid, FlexGridItem } from "baseui/flex-grid"
import { ProgressBar } from "baseui/progress-bar"
import { H3 } from "baseui/typography"

import React from "react"
import Auth from "../api/auth"
import Config from "../api/config"
import Notification from "../components/Notification"
import AnalyticsOptInForm from "../components/onboarding/AnalyticsOptInForm"

import CreateAdminAccountForm from "../components/onboarding/CreateAdminAccountForm"
import InstanceConfigForm from "../components/onboarding/InstanceConfigForm"
import WelcomeFragment from "../components/onboarding/WelcomeFragment"
import OnboardingContext, { IOnboardingContext } from "../context/OnboardingContext"
import { ONBOARDING_AUTH, ONBOARDING_COMPLETE } from "../events"

import "./OnboardingPage.scss"

type ReactFragmentChild = {
  title: string
  fragment: React.ReactFragment
  beforeNext?: () => Promise<[error: string | null, result?: any]>
  isPreviousEnabled: boolean
}

type OnboardingPageState = {
  error: string | null
  activeIndex: number
  activeChild: ReactFragmentChild
  values: IOnboardingContext
}

class OnboardingPage extends React.Component<any, OnboardingPageState> {
  children: ReactFragmentChild[]
  constructor(props: any) {
    super(props)

    this.children = [
      { title: "Welcome to Downplay", fragment: <WelcomeFragment />, isPreviousEnabled: true },
      {
        title: "Create Admin Account",
        fragment: <CreateAdminAccountForm />,
        isPreviousEnabled: true,
        beforeNext: async () => {
          try {
            const { username, password } = this.state.values.auth
            if (!username || !password) return ["Username and password required"]

            this.state.values.setIsProcessing!(true)

            const { token } = await Auth.register(username, password)
            PubSub.publish(ONBOARDING_AUTH, token)

            const config = await Config.get(token)

            console.log(config)

            this.state.values.setConfig!(config)
            this.state.values.setIsProcessing!(false)

            return [null, true]
          } catch (err) {
            this.state.values.setIsProcessing!(false)
            return [err, null]
          }
        },
      },
      { title: "Instance Configuration", fragment: <InstanceConfigForm />, isPreviousEnabled: false },
      {
        title: "Analytics Opt-In",
        fragment: <AnalyticsOptInForm />,
        isPreviousEnabled: true,
        beforeNext: async () => {
          try {
            this.state.values.setIsProcessing!(true)
            await Config.set(this.state.values.config)
            this.state.values.setIsProcessing!(false)
            PubSub.publish(ONBOARDING_COMPLETE)
            return [null, true]
          } catch (err) {
            this.state.values.setIsProcessing!(false)
            return [err, null]
          }
        },
      },
    ]

    this.state = {
      activeIndex: 0,
      error: null,
      activeChild: this.children[0],
      values: {
        auth: {},
        config: {},
        isProcessing: false,
        setAuth: (auth) => this.setState({ ...this.state, values: { ...this.state.values, auth } }),
        setConfig: (config) => this.setState({ ...this.state, values: { ...this.state.values, config } }),
        setIsProcessing: (isProcessing) =>
          this.setState({ ...this.state, values: { ...this.state.values, isProcessing } }),
      },
    }
  }

  onNextClicked = async () => {
    const currentIndex = this.state.activeIndex

    if (this.state.activeChild.beforeNext) {
      const [error, result] = await this.state.activeChild.beforeNext()
    }

    if (currentIndex + 1 < this.children.length) {
      this.setState({ ...this.state, activeIndex: currentIndex + 1, activeChild: this.children[currentIndex + 1] })
    }
  }

  onPreviousClicked = () => {
    const currentIndex = this.state.activeIndex

    if (currentIndex - 1 >= 0) {
      this.setState({ ...this.state, activeIndex: currentIndex - 1, activeChild: this.children[currentIndex - 1] })
    }
  }

  render() {
    const showPreviousButton = this.state.activeIndex > 0 && this.state.activeChild.isPreviousEnabled !== false
    const showNextButton = this.state.activeIndex < this.children.length - 1
    const showFinishButton = this.state.activeIndex === this.children.length - 1
    return (
      <OnboardingContext.Provider value={this.state.values}>
        <div className="OnboardingPage">
          {!!this.state.error && <Notification kind="negative" content={this.state.error}></Notification>}
          <Block display="block" maxWidth="700px" margin="20px auto">
            <Card>
              <H3 overrides={{ Block: { style: { textAlign: "center" } } }}>{this.state.activeChild?.title}</H3>
              <StyledBody>
                <Block margin="1.5rem 1rem">
                  <ProgressBar
                    size="large"
                    steps={this.children.length}
                    value={this.state.activeIndex * (100 / this.children.length)}
                    successValue={100}></ProgressBar>
                </Block>
                <Block padding="1rem">{this.state.activeChild.fragment}</Block>
                <FlexGrid flexGridColumnCount={1} margin="0 1rem">
                  <FlexGridItem>
                    {showPreviousButton && (
                      <Button
                        kind="tertiary"
                        overrides={{
                          Root: {
                            style: {
                              width: showNextButton || showFinishButton ? "45%" : "100%",
                              boxSizing: "border-box",
                              float: "left",
                            },
                          },
                        }}
                        disabled={!this.state.activeChild.isPreviousEnabled}
                        onClick={this.onPreviousClicked}>
                        Previous
                      </Button>
                    )}
                    {showNextButton && (
                      <Button
                        kind="secondary"
                        overrides={{
                          Root: {
                            style: {
                              width: showPreviousButton ? "45%" : "100%",
                              boxSizing: "border-box",
                              float: "right",
                            },
                          },
                        }}
                        isLoading={this.state.values.isProcessing}
                        onClick={this.onNextClicked}>
                        Next
                      </Button>
                    )}
                    {showFinishButton && (
                      <Button
                        kind="primary"
                        overrides={{ Root: { style: { width: showPreviousButton ? "45%" : "100%", float: "right" } } }}
                        onClick={this.onNextClicked}>
                        Finish
                      </Button>
                    )}
                  </FlexGridItem>
                </FlexGrid>
              </StyledBody>
            </Card>
          </Block>
        </div>
      </OnboardingContext.Provider>
    )
  }
}

export default OnboardingPage
