// components/SplashScreen.jsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

const SplashScreen = ({ onAnimationComplete }) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main animation sequence
    Animated.parallel([
      // Circle scale and fade in
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.out(Easing.elastic(1.2)),
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Text fade in
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ),

      // Flow animation (moving gradient effect)
      Animated.loop(
        Animated.timing(flowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
    ]).start();

    // Complete after total duration
    setTimeout(() => {
      onAnimationComplete();
    }, 3500);
  }, []);

  const flowInterpolate = flowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseInterpolate = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient */}
      <Animated.View style={[
        styles.backgroundGradient,
        {
          transform: [{ rotate: flowInterpolate }],
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1],
          }),
        }
      ]} />

      {/* Main Content */}
      <Animated.View style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { scale: pulseInterpolate },
          ],
        }
      ]}>
        {/* Animated Circle */}
        <Svg width={180} height={180} viewBox="0 0 200 200">
          <G rotation="-90" origin="100, 100">
            {/* Background Circle */}
            <Circle
              cx="100"
              cy="100"
              r="85"
              stroke="#f8f9fa"
              strokeWidth="14"
              fill="none"
              strokeOpacity="0.8"
            />
            
            {/* Period Segment (Red) - Animated */}
            <AnimatedCircle
              cx="100"
              cy="100"
              r="85"
              stroke="#ff9b9b"
              strokeWidth="14"
              strokeDasharray="53.57 251.33"
              strokeDashoffset="0"
              strokeLinecap="round"
              fill="none"
              opacity={fadeAnim}
            />
            
            {/* Fertile Segment (Blue) - Animated */}
            <AnimatedCircle
              cx="100"
              cy="100"
              r="85"
              stroke="#8BC8F8"
              strokeWidth="14"
              strokeDasharray="42.86 251.33"
              strokeDashoffset="53.57"
              strokeLinecap="round"
              fill="none"
              opacity={fadeAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 0.5, 1],
              })}
            />
            
            {/* Floating Indicator */}
            <AnimatedCircle
              cx="100"
              cy="100"
              r="85"
              stroke="#4c6ef5"
              strokeWidth="3"
              strokeDasharray="10 241.33"
              strokeDashoffset={flowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 251.33],
              })}
              strokeLinecap="round"
              fill="none"
              opacity={0.8}
            />
          </G>
        </Svg>
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[
        styles.textContainer,
        {
          opacity: textFadeAnim,
          transform: [
            {
              translateY: textFadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }
      ]}>
        <Text style={styles.appName}>PeriodPal</Text>
        <Text style={styles.tagline}>Your cycle, beautifully tracked</Text>
      </Animated.View>

      {/* Subtle Loading Indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: textFadeAnim }]}>
        <View style={styles.loadingDots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0.95, 1, 1.05],
                    outputRange: [0.4, 0.8, 0.4],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.95, 1, 1.05],
                        outputRange: [0.8, 1, 0.8],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    width: 400,
    height: 400,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(135deg, #8BC8F8 0%, #ff9b9b 50%, #f8f9fa 100%)',
    borderRadius: 200,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#4c6ef5',
    marginBottom: 8,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(76, 110, 245, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#868e96',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 60,
  },
  loadingDots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4c6ef5',
  },
});

export default SplashScreen;