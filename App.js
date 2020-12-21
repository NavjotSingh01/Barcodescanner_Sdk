/* eslint-disable prettier/prettier */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import { SafeAreaView, StyleSheet, ScrollView, View, Text } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
// import Main from './src/components/main';
import Major from './src/components/major';



export default function App() {
  return (
    <>
      <SafeAreaView>
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={styles.scrollView}>
          <View>
            <Text style={styles.bigBlue}>REACT NATIVE NAVOTAR </Text>
            <Text style={styles.big}>ID SCANNER </Text>
          </View>
          {/* <Main /> */}
          <Major />
          {/* <TouchScan /> */}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: 'white',
  },
  engine: {
    position: 'absolute',
    right: 0,
  },
  body: {
    backgroundColor: 'white',
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },

  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  highlight: {
    fontWeight: '700',
  },
  bigBlue: {
    color: 'green',
    fontWeight: '900',
    marginTop: 10,
    fontSize: 29,
    padding: 10,
    backgroundColor: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  big: {
    color: 'red',
    fontWeight: 'bold',
    fontSize: 20,
    backgroundColor: 'white',
    textAlign: 'center',
    marginBottom: 20
  },
  footer: {
    color: Colors.dark,
    fontSize: 12,
    fontWeight: '600',
    padding: 4,
    paddingRight: 12,
    textAlign: 'right',
  },
});
