// Components/CycleCircle.jsx
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const CycleCircle = ({ 
  periodDays = 5, 
  fertileDays = 6, 
  totalDays = 28,
  currentDay = 14
}) => {
  const size = 280;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const center = size / 2;
  
  // Animation value for the indicator
  const indicatorAnimation = useRef(new Animated.Value(0)).current;
  
  // Calculate arc lengths
  const periodArc = (periodDays / totalDays) * circumference;
  const fertileArc = (fertileDays / totalDays) * circumference;
  const otherArc = circumference - periodArc - fertileArc;

  const calPerArc = periodArc - 45;
  const calCircumference = circumference - 20;
  
  // Calculate current day angle for indicator - FIXED to start from top!
  // Day 1 = 0° (top), Day 28 = 360° (back to top)
  const currentAngle = ((currentDay - 1) / totalDays) * 360;
  
  // Animate the indicator when currentDay changes
  useEffect(() => {
    Animated.timing(indicatorAnimation, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [currentDay]);

  // Calculate indicator position with interpolation
  const indicatorRotation = indicatorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${currentAngle}deg`],
  });

  // Counter rotation to keep text upright
  const textRotation = indicatorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${-currentAngle}deg`],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Remove the G rotation since we're handling it differently now */}
          
          {/* Background Circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#f8f9fa"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Other Days - now we need to manually offset each segment */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e9ecef"
            strokeWidth={strokeWidth}
            strokeDasharray={`${otherArc} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            fill="none"
            rotation="-85"
            origin={`${center}, ${center}`}
          />

          {/* Fertile Window */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#74c0fc"
            strokeWidth={strokeWidth}
            strokeDasharray={`${fertileArc} ${circumference}`}
            strokeDashoffset={otherArc}
            strokeLinecap="round"
            fill="none"
            rotation="-180"
            origin={`${center}, ${center}`}
          />

          {/* Period Days */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#ff8787"
            strokeWidth={strokeWidth}
            strokeDasharray={`${calPerArc} ${circumference - calPerArc}`}
            strokeDashoffset={otherArc + fertileArc}
            strokeLinecap="round"
            fill="none"
            rotation="210"
            origin={`${center}, ${center}`}
          />
        </Svg>
        
        {/* Animated Current Day Indicator */}
        <Animated.View 
          style={[
            styles.indicatorContainer,
            { 
              transform: [
                { rotate: indicatorRotation }
              ] 
            }
          ]}
        >
          <View style={styles.indicatorLine} />
          <View style={styles.indicatorDot}>
            <Animated.Text style={[
              styles.indicatorText,
              { 
                transform: [
                  { rotate: textRotation }
                ] 
              }
            ]}>
              {currentDay}
            </Animated.Text>
          </View>
        </Animated.View>
        
        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={styles.dayNumber}>{currentDay}</Text>
          <Text style={styles.dayLabel}>Day {currentDay}</Text>
          <Text style={styles.totalDays}>of {totalDays}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#ff8787' }]} />
          <Text style={styles.legendText}>Period ({periodDays}d)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#74c0fc' }]} />
          <Text style={styles.legendText}>Fertile ({fertileDays}d)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.colorDot, { backgroundColor: '#e9ecef' }]} />
          <Text style={styles.legendText}>Other</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  dayNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#495057',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 16,
    color: '#868e96',
    fontWeight: '500',
  },
  totalDays: {
    fontSize: 14,
    color: '#adb5bd',
    marginTop: 2,
  },
  indicatorContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  indicatorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#4c6ef5',
    marginTop: 10,
  },
  indicatorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4c6ef5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4c6ef5',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 20,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },
});

export default CycleCircle;