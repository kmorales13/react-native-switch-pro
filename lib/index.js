import React, { Component } from 'react'
import PropTypes from "prop-types"
import {
  ViewPropTypes,
  StyleSheet,
  Animated,
  Easing,
  PanResponder,
  TouchableOpacity,
  Text,
  View
} from 'react-native'

export default class extends Component {
  static propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    value: PropTypes.bool,
    defaultValue: PropTypes.bool,
    disabled: PropTypes.bool,
    circleColorActive: PropTypes.string,
    circleColorInactive: PropTypes.string,
    backgroundActive: PropTypes.string,
    backgroundInactive: PropTypes.string,
    onAsyncPress: PropTypes.func,
    onSyncPress: PropTypes.func,
    style: ViewPropTypes.style
  }

  static defaultProps = {
    width: 100,
    height: 40,
    defaultValue: false,
    disabled: false,
    circleColorActive: 'white',
    circleColorInactive: 'white',
    backgroundActive: '#EB9338',
    backgroundInactive: '#FFAB40',
    onAsyncPress: (callback) => {callback(true)}
  }

  constructor (props, context) {
    super(props, context)
    const { width, height } = props

    this.offset = width - height + 1
    this.handlerSize = height - 2

    const value = props.value || props.defaultValue
    this.state = {
      value,
      toggleable: true,
      alignItems: value ? 'flex-end' : 'flex-start',
      handlerAnimation: new Animated.Value(this.handlerSize),
      switchAnimation: new Animated.Value(value ? -1 : 1)
    }
  }

  componentWillReceiveProps (nextProps) {
    const { value } = this.state
    if (nextProps === this.props) {
      return
    }

    if (typeof nextProps.value !== 'undefined' && nextProps.value !== value) {
      this.toggleSwitch(true)
    }
  }

  componentWillMount () {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onPanResponderGrant: this._onPanResponderGrant,
      onPanResponderMove: this._onPanResponderMove,
      onPanResponderRelease: this._onPanResponderRelease
    })
  }

  _onPanResponderGrant = (evt, gestureState) => {
    const { disabled } = this.props
    if (disabled) return

    this.animateHandler(this.handlerSize * 6 / 5)
  }

  _onPanResponderMove = (evt, gestureState) => {
    const { value, toggleable } = this.state
    const { disabled } = this.props
    if (disabled) return

    this.setState({
      toggleable: value ? (gestureState.dx < 10) : (gestureState.dx > -10)
    })
  }

  _onPanResponderRelease = (evt, gestureState) => {
    const { handlerAnimation, toggleable, value } = this.state
    const { height, disabled, onAsyncPress, onSyncPress } = this.props

    if (disabled) return

    if (toggleable) {
      if (onSyncPress) {
        this.toggleSwitch(true, onSyncPress)
      } else {
        onAsyncPress(this.toggleSwitch)
      }
    } else {
      this.animateHandler(this.handlerSize)
    }
  }

  toggleSwitch = (result, callback = () => null) => { // result of async
    const { value, switchAnimation } = this.state
    const toValue = !value

    this.animateHandler(this.handlerSize)
    if (result) {
      this.animateSwitch(toValue, () => {
        callback(toValue)
        this.setState({
          value: toValue,
          alignItems: toValue ? 'flex-end' : 'flex-start'
        })
        switchAnimation.setValue(toValue ? -1 : 1)
      })
    }
  }

  animateSwitch = (value, callback = () => null) => {
    const { switchAnimation } = this.state

    Animated.timing(switchAnimation,
      {
        toValue: value ? this.offset : -this.offset,
        duration: 200,
        easing: Easing.linear
      }
    ).start(callback)
  }

  animateHandler = (value, callback = () => null) => {
    const { handlerAnimation } = this.state

    Animated.timing(handlerAnimation,
      {
        toValue: value,
        duration: 200,
        easing: Easing.linear
      }
    ).start(callback)
  }

  render() {
    const { switchAnimation, handlerAnimation, alignItems, value } = this.state
    const {
      backgroundActive, backgroundInactive,
      width, height, circleColorActive, circleColorInactive, style,
      ...rest
    } = this.props

    const interpolatedBackgroundColor = switchAnimation.interpolate({
      inputRange: value ? [-this.offset, -1]: [1, this.offset],
      outputRange: [backgroundInactive, backgroundActive]
    })

    const interpolatedCircleColor = switchAnimation.interpolate({
      inputRange: value ? [-this.offset, -1]: [1, this.offset],
      outputRange: [circleColorInactive, circleColorActive]
    })

    return (
      <View>
        <Animated.View
          {...rest}
          {...this._panResponder.panHandlers}
          style={[styles.container, style, {
            width, height,
            alignItems,
            borderRadius: 0,
            backgroundColor: interpolatedBackgroundColor }]}
        >
          <Text style={styles.fText}>°F</Text>
          <Text style={styles.cText}>°C</Text>
          <Animated.View style={{
            backgroundColor: interpolatedCircleColor,
            width: handlerAnimation,
            height: this.handlerSize,
            borderRadius: 0,
            transform: [{ translateX: switchAnimation }]
          }} />
        </Animated.View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center'
  },
  fText: {
    position: "absolute",
    alignSelf: "flex-start",
    marginLeft: 20,
    fontSize: 20,
    color: "white"
  },
  cText: {
    position: "absolute",
    alignSelf: "flex-start",
    marginLeft: 60,
    fontSize: 20,
    color: "white"
  }
})
