/* eslint-disable prettier/prettier */
/* eslint-disable no-shadow */
/* eslint-disable no-undef */
/* eslint-disable react-native/no-inline-styles */
import React, { Component } from 'react';
import {
  StyleSheet,
  View,
  Button,
  Text,
  Image,
  ScrollView,
  NativeEventEmitter,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Regula from '@regulaforensics/react-native-document-reader-api';
import * as RNFS from 'react-native-fs';
import RadioGroup from 'react-native-radio-buttons-group';
import ImagePicker from 'react-native-customized-image-picker';
import * as Progress from 'react-native-progress';
import CheckBox from 'react-native-check-box';

const eventManager = new NativeEventEmitter(Regula.RNRegulaDocumentReader);
const DocumentReader = Regula.DocumentReader;
const Enum = DocumentReader.Enum;

var licPath =
  Platform.OS === 'ios'
    ? RNFS.MainBundlePath + '/regula.license'
    : 'regula.license';
var certDir =
  Platform.OS === 'ios'
    ? RNFS.MainBundlePath + '/certificates'
    : 'certificates';
var readDir = Platform.OS === 'ios' ? RNFS.readDir : RNFS.readDirAssets;
var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets;

async function addCertificates() {
  var certificates = [];
  var items = await readDir(certDir, 'base64');

  for (var i in items) {
    var item = items[i];
    if (item.isFile()) {
      var findExt = item.name.split('.');
      var pkdResourceType = 0;
      if (findExt.length > 0) {
        pkdResourceType = Enum.PKDResourceType.getType(
          findExt[findExt.length - 1].toLowerCase(),
        );
      }

      var file = await readFile(item.path, 'base64');
      certificates.push({
        binaryData: file,
        resourceType: pkdResourceType,
      });
    }
  }
  DocumentReader.addPKDCertificates(
    certificates,
    (s) => {
      console.log('certificates added');
    },
    (e) => console.log(e),
  );
}

export default class Major extends Component {
  constructor(props) {
    super(props);
    eventManager.addListener('prepareDatabaseProgressChangeEvent', (e) =>
      this.setState({ fullName: 'Downloading database: ' + e.msg + '%', dateOfBirth: 'Downloading database: ' + e.msg + '%', documentNumber: 'Downloading database: ' + e.msg + '%', address: 'Downloading database: ' + e.msg + '%', dateOfIssue: 'Downloading database: ' + e.msg + '%',dateOfExpiry: 'Downloading database: ' + e.msg + '%' }),
    );
    eventManager.addListener('completionEvent', (e) =>
      this.handleCompletion(
        DocumentReader.DocumentReaderCompletion.fromJson(JSON.parse(e.msg)),
      ),
    );
    DocumentReader.prepareDatabase(
      'Full',
      (respond) => {
        console.log(respond);
        readFile(licPath, 'base64').then((res) => {
          this.setState({ fullName: 'Initializing...', dateOfBirth: 'Initializing...', documentNumber: 'Initializing...', address: 'Initializing...', dateOfIssue: 'Initializing...', dateOfExpiry: 'Initializing...' });
          DocumentReader.initializeReader(
            res,
            (respond) => {
              console.log(respond);
              DocumentReader.isRFIDAvailableForUse(
                (canRfid) => {
                  if (canRfid) {
                    this.setState({
                      canRfid: true,
                      rfidUIHeader: 'Reading RFID',
                      rfidDescription: 'Place your phone on top of the NFC tag',
                      rfidUIHeaderColor: 'black',
                    });
                    this.setState({ canRfidTitle: '' });
                  }
                },
                (error) => console.log(error),
              );
              DocumentReader.getAvailableScenarios(
                (jstring) => {
                  var scenariosTemp = JSON.parse(jstring);
                  var scenariosL = [];
                  for (var i in scenariosTemp) {
                    scenariosL.push({
                      label: DocumentReader.Scenario.fromJson(
                        typeof scenariosTemp[i] === 'string'
                          ? JSON.parse(scenariosTemp[i])
                          : scenariosTemp[i],
                      ).name,
                      value: i,
                    });
                  }
                  this.setState({ scenarios: scenariosL });
                  this.setState({
                    selectedScenario: this.state.scenarios[0].label,
                  });
                  this.setState({ radio: null });
                  this.setState({
                    radio: (
                      <RadioGroup
                        style={{ alignSelf: 'stretch' }}
                        radioButtons={this.state.scenarios}
                        onPress={(data) => {
                          var selectedItem;
                          for (var index in data) {
                            if (data[index].selected) {
                              selectedItem = data[index].label;
                            }
                          }
                          this.setState({ selectedScenario: selectedItem });
                        }}
                      />
                    ),
                  });
                  DocumentReader.getDocumentReaderIsReady(
                    (isReady) => {
                      if (isReady) {
                        this.setState({ fullName: 'Full Name', dateOfBirth: 'Date Of Birth', documentNumber: 'Document Id', address: 'Address', dateOfIssue: 'Date Of Issue', dateOfExpiry: 'Date Of Expiry' });
                        // addCertificates()
                      } else {
                        this.setState({ fullName: 'Not visualized', dateOfBirth: 'Not visuaized', documentNumber: 'Not visuaized', address: 'Not visuaized',dateOfIssue: ' Not visuaized', dateOfExpiry: ' Not visuaized' });
                      }
                    },
                    (error) => console.log(error),
                  );
                },
                (error) => console.log(error),
              );
            },
            (error) => console.log(error),
          );
        });
      },
      (error) => console.log(error),
    );

    this.state = {
      fullName: 'Please wait...',
      dateOfBirth: 'Please wait...',
      documentNumber: 'Pease wait...',
      address: 'Please wait...',
      dateOfIssue: 'Please wait...',
      dateOfExpiry: 'Please wait...',
      doRfid: false,
      canRfid: false,
      canRfidTitle: '(unavailable)',
      scenarios: [],
      selectedScenario: '',
      portrait: require('../../images/portrait.png'),
      docFront: require('../../images/id.png'),
      radio: (
        <RadioGroup
          style={{ alignSelf: 'stretch' }}
          radioButtons={[{ label: 'Loading', value: 0 }]}
          onPress={null}
        />
      ),
    };
  }

  handleCompletion(completion) {
    if (
      this.state.isReadingRfid &&
      (completion.action === Enum.DocReaderAction.CANCEL ||
        completion.action === Enum.DocReaderAction.ERROR)
    ) {
      this.hideRfidUI();
    }
    if (
      this.state.isReadingRfid &&
      completion.action === Enum.DocReaderAction.NOTIFICATION
    ) {
      this.updateRfidUI(completion.results.documentReaderNotification);
    }
    if (completion.action === Enum.DocReaderAction.COMPLETE) {
      if (this.state.isReadingRfid) {
        if (completion.results.rfidResult !== 1) {
          this.restartRfidUI();
        } else {
          this.hideRfidUI();
          this.displayResults(completion.results);
        }
      } else {
        this.handleResults(completion.results);
      }
    }
  }

  showRfidUI() {
    // show animation
    this.setState({ isReadingRfid: true });
  }

  hideRfidUI() {
    // show animation
    this.restartRfidUI();
    this.setState({
      isReadingRfid: false,
      rfidUIHeader: 'Reading RFID',
      rfidUIHeaderColor: 'black',
    });
  }

  restartRfidUI() {
    this.setState({
      rfidUIHeaderColor: 'red',
      rfidUIHeader: 'Failed!',
      rfidDescription: 'Place your phone on top of the NFC tag',
      rfidProgress: -1,
    });
  }

  updateRfidUI(results) {
    if (
      results.code ===
      Enum.eRFID_NotificationAndErrorCodes
        .RFID_NOTIFICATION_PCSC_READING_DATAGROUP
    ) {
      this.setState({
        rfidDescription: Enum.eRFID_DataFile_Type.getTranslation(
          results.number,
        ),
      });
    }
    this.setState({
      rfidUIHeader: 'Reading RFID',
      rfidUIHeaderColor: 'black',
      rfidProgress: results.value / 100,
    });
    if (Platform.OS === 'ios') {
      DocumentReader.setRfidSessionStatus(
        this.state.rfidDescription + '\n' + results.value + '%',
        (e) => { },
        (e) => { },
      );
    }
  }

  clearResults() {
    this.setState({
      fullName: 'Ready',
      dateOfBirth: 'Ready',
      documentNumber: 'Ready',
      dateOfIssue: 'Ready',
      dateOfExpiry: 'Ready',
      address: 'Ready',
      docFront: require('../../images/id.png'),
      portrait: require('../../images/portrait.png'),
    });
  }

  displayResults(results) {
    this.setState({
      fullName: results.getTextFieldValueByType({
        fieldType: Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES,
      }),
      dateOfBirth: results.getTextFieldValueByType({
        fieldType: Regula.DocumentReader.Enum.eVisualFieldType.FT_DATE_OF_BIRTH,
      }),
      documentNumber: results.getTextFieldValueByType({
        fieldType: Regula.DocumentReader.Enum.eVisualFieldType.FT_DOCUMENT_NUMBER,
      }),
      address: results.getTextFieldValueByType({
        fieldType: Regula.DocumentReader.Enum.eVisualFieldType.FT_ADDRESS,
      }),
      dateOfIssue: results.getTextFieldValueByType({
        fieldType: Regula.DocumentReader.Enum.eVisualFieldType.FT_DATE_OF_ISSUE,
      }),
      dateOfExpiry: results.getTextFieldValueByType({
        fieldType: Regula.DocumentReader.Enum.eVisualFieldType.FT_DATE_OF_EXPIRY,
      }),
    });
    if (
      results.getGraphicFieldImageByType({
        fieldType: Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE,
      }) != null
    ) {
      this.setState({
        docFront: {
          uri:
            'data:image/png;base64,' +
            results.getGraphicFieldImageByType({
              fieldType: Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE,
            }),
        },
      });
    }
    if (
      results.getGraphicFieldImageByType({
        fieldType: Enum.eGraphicFieldType.GF_PORTRAIT,
      }) != null
    ) {
      this.setState({
        portrait: {
          uri:
            'data:image/png;base64,' +
            results.getGraphicFieldImageByType({
              fieldType: Enum.eGraphicFieldType.GF_PORTRAIT,
            }),
        },
      });
    }
  }

  customRFID() {
    this.showRfidUI();
    DocumentReader.readRFID(
      (e) => { },
      (e) => { },
    );
  }

  usualRFID() {
    this.setState({ doRfid: false });
    DocumentReader.startRFIDReader(
      (e) => { },
      (e) => { },
    );
  }

  handleResults(results) {
    if (this.state.doRfid && results != null && results.chipPage != 0) {
      accessKey = null;
      accessKey = results.getTextFieldValueByType(
        Enum.eVisualFieldType.FT_MRZ_STRINGS,
      );
      if (accessKey != null && accessKey != '') {
        accessKey = accessKey.replace(/^/g, '').replace(/\n/g, '');
        DocumentReader.setRfidScenario(
          {
            mrz: accessKey,
            pacePasswordType: Enum.eRFID_Password_Type.PPT_MRZ,
          },
          (e) => { },
          (error) => console.log(error),
        );
      } else {
        accessKey = null;
        accessKey = results.getTextFieldValueByType(159);
        if (accessKey != null && accessKey != '') {
          DocumentReader.setRfidScenario(
            {
              password: accessKey,
              pacePasswordType: Enum.eRFID_Password_Type.PPT_CAN,
            },
            (e) => { },
            (error) => console.log(error),
          );
        }
      }
      // this.customRFID()
      this.usualRFID();
    } else {
      this.displayResults(results);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        {this.state.isReadingRfid && Platform.OS === 'android' && (
          <View style={styles.container}>
            <Text
              style={{
                paddingBottom: 30,
                fontSize: 23,
                color: this.state.rfidUIHeaderColor,
              }}>
              {this.state.rfidUIHeader}
            </Text>
            <Text style={{ paddingBottom: 50, fontSize: 20 }}>
              {this.state.rfidDescription}
            </Text>
            <Progress.Bar
              width={200}
              useNativeDriver={true}
              color="#4285F4"
              progress={this.state.rfidProgress}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                this.hideRfidUI();
              }}>
              <Text style={{ fontSize: 20 }}>X</Text>
            </TouchableOpacity>
          </View>
        )}
        {!this.state.isReadingRfid && (
          <View style={styles.container}>
            <Text
              style={{
                top: 1,
                left: 1,
                padding: 6,
                fontSize: 20,
              }}>
              {this.state.fullName}
            </Text>
            <Text>{this.state.dateOfBirth}</Text>
            <Text>{this.state.documentNumber}</Text>
            <Text>{this.state.address}</Text>
            <Text>{this.state.dateOfIssue}</Text>
            <Text>{this.state.dateOfExpiry}</Text>
            <View style={{ flexDirection: 'row', padding: 5 }}>
              <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                <Text
                  style={{
                    top: 1,
                    right: 1,
                    padding: 5,
                  }}>
                  Portrait
                </Text>
                <Image
                  style={{
                    height: 150,
                    width: 150,
                  }}
                  source={this.state.portrait}
                  resizeMode="contain"
                />
              </View>
              <View
                style={{
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 5,
                }}>
                <Text
                  style={{
                    top: 1,
                    right: 1,
                    padding: 5,
                  }}>
                  Document image
                </Text>
                <Image
                  style={{
                    height: 150,
                    width: 200,
                  }}
                  source={this.state.docFront}
                  resizeMode="contain"
                />
              </View>
            </View>

            <ScrollView style={{ padding: 5, alignSelf: 'stretch' }}>
              {this.state.radio}
            </ScrollView>

            <View style={{ flexDirection: 'row', padding: 5 }}>
              <CheckBox
                isChecked={this.state.doRfid}
                onClick={() => {
                  if (this.state.canRfid) {
                    this.setState({ doRfid: !this.state.doRfid });
                  }
                }}
                disabled={!this.state.canRfid}
              />
              <Text style={{ padding: 5 }}>
                {'Process rfid reading' + this.state.canRfidTitle}
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <Button
                color="#4285F4"
                onPress={() => {
                  this.clearResults();
                  DocumentReader.setConfig(
                    {
                      functionality: {
                        videoCaptureMotionControl: true,
                        showCaptureButton: true,
                      },
                      customization: {
                        showResultStatusMessages: true,
                        showStatusMessages: true,
                      },
                      processParams: {
                        scenario: this.state.selectedScenario,
                        doRfid: this.state.doRfid,
                      },
                    },
                    (e) => { },
                    (error) => console.log(error),
                  );

                  DocumentReader.showScanner(
                    (s) => { },
                    (e) => console.log(e),
                  );
                }}
                title="Scan document"
              />
              <Text style={{ padding: 5 }} />
              <Button
                color="#4285F4"
                onPress={() => {
                  this.clearResults();
                  this.setState({ fullName: 'COPYING IMAGE...', dateOfBirth: 'COPYING IMAGE...', documentNumber: 'COPYING IMAGE...', address: 'COPYING IMAGE...',dateOfIssue: 'COPYING IMAGE...', dateOfExpiry: 'COPYING IMAGE...' });
                  ImagePicker.openPicker({
                    multiple: true,
                    includeBase64: true,
                  })
                    .then((response) => {
                      DocumentReader.setConfig(
                        {
                          functionality: {
                            videoCaptureMotionControl: true,
                            showCaptureButton: true,
                          },
                          customization: {
                            showResultStatusMessages: true,
                            showStatusMessages: true,
                          },
                          processParams: {
                            scenario: this.state.selectedScenario,
                            doRfid: this.state.doRfid,
                          },
                        },
                        (e) => { },
                        (error) => console.log(error),
                      );

                      var images = [];

                      for (var i = 0; i < response.length; i++) {
                        images.push(response[i].data);
                      }
                      this.setState({ fullName: 'PROCESSING...', dateOfBirth: 'PROCESSING...', documentNumber: 'PROCESSING...', address: 'PROCESSING...',dateOfIssue: 'PROCESSING...',dateOfExpiry: 'PROCESSING...' });
                      DocumentReader.recognizeImages(
                        images,
                        (s) => { },
                        (e) => console.log(e),
                      );
                    })
                    .catch((e) => {
                      console.log('ImagePicker: ' + e);
                    });
                }}
                title="     Scan image     "
              />
            </View>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginBottom: 12,
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 0,
    right: 20,
  },
});
