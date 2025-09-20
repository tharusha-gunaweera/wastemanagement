// Home.jsx
import { StyleSheet, Text, View } from 'react-native';
import CycleCircle from '../Components/CycleCircle';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cycle Tracker</Text>
      <Text style={styles.subtitle}>Your current cycle progress</Text>
      
      <View style={{ marginVertical: 30 }}>
        <CycleCircle 
          periodDays={5} 
          fertileDays={6} 
          totalDays={28}
          currentDay={11}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Period days left</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>14</Text>
          <Text style={styles.statLabel}>Days completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>9</Text>
          <Text style={styles.statLabel}>Days remaining</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#FAFAFA'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
    paddingHorizontal: 20
  },
  statItem: {
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333'
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  }
});