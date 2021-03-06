import React, {useState, useCallback, useRef, useEffect} from 'react'; 
import { 
  SafeAreaView, View, Button, RefreshControl, StyleSheet, Text,TextInput, ScrollView, Image, TouchableOpacity
} from 'react-native';
import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Setting a timer']);
import MessageBubble from './MessageBubble';
import messagesInitiauxBot from './messagesInitiauxBot.json';
import { Ionicons, AntDesign } from '@expo/vector-icons'; 

var timeOut_ID = undefined;      

/**
 * Cette fonction correspond à la page messagerie que l'on appelle dans App.js,
 * elle est composée des différents composants provenant de MessageBubble.js 
 * (pour l'affichage des messages) 
 */
const PageMessagerie = ({navigation}) => {
  
  // Variables de state
  const [refreshing, setRefreshing] = useState(false); // Variable qui indique que la page se raffraichit
  const [inputText, setInputText] = useState(""); // Variable qui récupère la valeur de l'inputText
  const [sessionId, setSessionId] = useState(""); // Variable qui demande une session au Bot
  const [dataSource, setDataSource] = useState([]); // Variable contenant les messages de la conversation
  const [isSessionOff, setSessionOff] = useState(false); // Variable dépendant du timer (permettant de mettre la session off)
  
  // Variable qui fait référence à notre scrollView, cela permet de la manipuler depuis notre code
  const scrollViewRef = useRef();
  
  // Valeurs par défaut de nos messages
  const motDefini = ["Solution","Classement", "IBM","J\'aime Lille","Indice X","Indice Y","Indice Z","Bonjour","J\'aime IBM","Qui est tu ?"]
  const indice_1 = "Indice X:\n\nX = Trouver le nombre de 6 chiffres se positionnant après la première occurence de 036695 dans les décimales de PI. Convertir ce nombre de la base10 en base26";
  const indice_2 = "Indice Y:\n\nY = https://pasteboard.co/074 065 051 049 084 077 048 046 112 110 103/";
  const indice_3 = "Indice Z:\n\nZ = 'X'+'Y' Lille";

  // Lien de l'API du Bot
  const url = "https://nodejs-express-app-cxlkb-2020-11-30.eu-gb.mybluemix.net/ai"

  /* Fonction permettant de stopper le programme pendant n milliseconde(s) */
  const wait = (timeout) => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }
  
  /* Fonction permettant de lancer une seule fois les fonctions à l'ouverture de la page */
  useEffect(() => {
    getFirstMessages();
    getSession(url);
  }, []) 
  
  /* Fonction permettant de récupérer les 3 messages initiaux du Bot que nous avons programmé (messagesInitiauxBot.json) */
  const getFirstMessages = () => {
    let data = messagesInitiauxBot;
    for(let i = 0; i < data.length; i++)
      data[i].horaire = getCurrentDate();
    setDataSource(data);
  }

  /* Fonction permettant de rafraichir la vue des messages afin de les actualiser */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    wait(100).then(() => setRefreshing(false));
  }, []);

  /**
   * Fonction permettant :
   * - d'ajouter un message et lance la fonction onRefresh
   * - de montrer que la session est off (changement de couleur des messages (isSessionOff)) 
   */
  const refreshAndAddMessage = (mine,textMessage) =>{
    if(isSessionOff){
      getSession();
      setSessionOff(false);
    }

    if(textMessage!=""){

      // On joute notre message à notre state
      let dataSource_temp = dataSource;
      dataSource_temp.push({
        "mine":mine,
        "text":textMessage,
        "horaire":getCurrentDate(),
        "isSessionOff":false
      });
      setDataSource(dataSource_temp);

      onRefresh(); 
      
      if(mine){
        sendMessageToBot(textMessage);
        
        // Ici, on réinitialise ou initialise notre timer de 5min pour le time-out
        if(timeOut_ID != undefined){
          clearTimeout(timeOut_ID);
        }
        timeOut_ID = setTimeout(() => {
          // En cas de time-out, on grise tous les messages et on indique 
          // que la session est off pour la relancer avec le prochain message.
          setSessionOff(true);
          dataSource.slice(3).map((data) => {
            data.isSessionOff = true;
          })
          onRefresh();
        }, 5*60*1000);
      }

      setInputText("") // on réinitialise notre textinput
    }
  } 

  /* Requête HTTP permttant de démarrer une session avec le Bot */
  const getSession = () =>{
    fetch(url + '/session').then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong');
      }
    })
    .then((responseJson) => {
      // On enregistre notre session_id dans le state pour la suite
      setSessionId(responseJson.response);
    })
    .catch((error) => {
      console.log(error)
    });
  }    

  /**
   * Fonction permettant :
   * - d'envoyer un message au Bot (requête POST)
   * - de recevoir la réponse du Bot
   */
  const sendMessageToBot = (messageText) =>{

    // On regarde d'abord si notre message correspond à un message customisé.
    // Auquel cas l'application devra réagir.
    if(messageText == "Solution"){
      setTimeout(() => {
        setInputText("Palais Rameau");
      }, 1000);
      navigation.navigate("Solution");
    }
    else if(messageText == "Indice X"){
      refreshAndAddMessage(false,indice_1);
    }
    else if(messageText == "Indice Y"){
      refreshAndAddMessage(false,indice_2);
    }
    else if(messageText == "Indice Z"){
      refreshAndAddMessage(false,indice_3);
    }
    else{
      // Si le message ne correspond pas à un message custimisé, on envoie le message au bot.
      fetch(url, { 
        method: "POST", 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({sessionId: sessionId, reqText: messageText})
        })
      .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw new Error('Something went wrong');
      }
      })
      .then((responseJson) => {
        // On récupère le message que le bot a envoyé en réponse et on l'enregistre.
        refreshAndAddMessage(false,responseJson.response);
      })
      .catch((error) => {
        console.log(error)
      });
    }
  }

  return(
    <SafeAreaView style={styles.safeViewAreaContainer}>
      
      {/* Vue du bandeau supérieur de la page */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          onPress={() => navigation.navigate("PageAccueil")}
          style={[styles.btn_send_return,{marginLeft:10}]}
        >
          <AntDesign name="back" size={30} color="#287BF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
            Conversation avec BOTTY
        </Text>
        <Image style={styles.headerImage}
            source={require('../assets/iconbot.png')}
        />
      </View>

      {/* Vue défilante des messages échangés avec le Bot */}
      <ScrollView
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>} 
        showsVerticalScrollIndicator={true}
      >
        { dataSource.length > 0 &&
          dataSource.map((message, index) => {
            return (
              <MessageBubble
                key = {index}
                mine = {message.mine}
                text = {message.text}
                horaire = {message.horaire}
                isSessionOff = {message.isSessionOff}
              />
            )
          })
        }
      </ScrollView>
      
      {/* Vue du support inférieur (bandeau de réponses pré-programmées et entrée texte) */}
      <View>
        {/* Vue du bandeau inférieur situé au dessus de l'entrée texte */}
        <ScrollView 
          horizontal={true}
          style={styles.horizontal_scroll} 
          keyboardShouldPersistTaps='always'
        >
          { motDefini.length > 0 &&
              motDefini.map((mot,key) => {
                return (
                  <TouchableOpacity 
                    key={key}
                    style = {styles.horizontal_scroll_content}
                    onPress={() => refreshAndAddMessage(true,mot)} 
                  >
                    <Text style = {{fontWeight: 'bold', color: '#FFF'}}>
                      {mot}
                    </Text>
                  </TouchableOpacity>
                )
              })
          }
        </ScrollView>

        {/* Vue de l'entrée texte et du bouton d'envoie */}
        <View style={styles.keyboardContainer}>
          <TextInput
            style={styles.input}
            placeholder='Ajouter votre texte ...'
            onChangeText={(input) => setInputText(input)}
            value={inputText}
            onKeyPress={ (event) => {
              if(event.nativeEvent.key == "Enter"){
                refreshAndAddMessage(true, inputText)
              }
            }}
            onTouchStart={() => {
              setTimeout(() => {
                scrollViewRef.current.scrollToEnd({ animated: true })
              }, 500);
            }}
            onChange={() => scrollViewRef.current.scrollToEnd({ animated: true })}
          />
          <TouchableOpacity onPress={() => refreshAndAddMessage(true, inputText)} style={styles.btn_send_return}>
            <Ionicons name="send" size={30} color="#287BF6" />
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

/* Fonction permettant de récupérer l'horaire auquel le message a été envoyé ou reçu */
const getCurrentDate = () => {
  var dateHours = new Date().getHours();
  var dateMin = new Date().getMinutes();
  if (dateMin.toLocaleString().length < 2){
    dateMin = '0'+dateMin;
  }
  if (dateHours.toLocaleString().length < 2){
    dateHours = '0'+dateHours;
  }
  let date = dateHours + ':' + dateMin;
  return date;
};

const styles = StyleSheet.create({
  input:{
    marginLeft: 10,
    marginRight: 10,
    padding: 6,
    borderWidth: 0.5,
    borderRadius: 4,
    backgroundColor: "#fff",
    flex: 4,
    flexDirection: 'row'
  },
  horizontal_scroll:{
    flexDirection: 'row',
    height: 50,
    marginBottom:5
  },
  horizontal_scroll_content:{
    marginHorizontal: 1,
    backgroundColor: "#287BF6",
    borderRadius: 30,
    alignSelf: 'center',
    paddingVertical:7,
    paddingHorizontal: 15,
    borderWidth:1,
    borderColor:"rgba(128,128,128,0.1)"
  },
  btn_send_return:{
    marginRight: 10,
    padding:5,
    alignSelf: 'center',
    borderRadius:30,
  },
  safeViewAreaContainer: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 20,
    paddingBottom: 10
  },
  headerContainer: {
    flexDirection: 'row',
    alignSelf: 'center'
  },
  headerTitle: {
    alignSelf: 'center',
    fontSize: 15,
    flex: 1,
    textAlign: 'center'
  },
  headerImage: {
    width: 50,
    height: 50,
    marginTop: 7,
    marginRight: 10
  },
  keyboardContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  }
});

export default PageMessagerie;