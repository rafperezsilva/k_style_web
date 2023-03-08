import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import React, { useState } from 'react';
import ModalDialog from 'react-bootstrap/ModalDialog'
import ReactplosiveModal from "reactplosive-modal";
import { QrReader2 } from 'react-qr-reader';
import logo from './logo.png';
import './App.css';
//import products from './products.json';
import QrReader from "react-web-qr-reader";
import axios from "axios";

var ReactDOM = require('react-dom');

var productsList = [];
var productSell = [];
var cart = [];

//const [isModalVisible, setIsModalVisible] = useState(false);
var [modalShow, setModalShow] = [];
var [modalType, setModalType] = [];
var buttonTitle = ""
var productToEdit = undefined;    
var loaderContainer = document.querySelector('.loader-container');
window.addEventListener('load', () => {
  if(loaderContainer){
    loaderContainer.style.display = 'none';
  }
});
  
function showMessage(msg){
  // Get the snackbar DIV
  var x = document.getElementById("snackbar");
  x.innerHTML = msg;
  // Add the "show" class to DIV
  x.className = "show";

  // After 3 seconds, remove the show class from DIV
  setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
}
function isAdminRole(){
  return getCookie("role") && getCookie("role") === "admin"
}
function sessionHandler(user, pass){
  const mainDiv = document.getElementById("main_div")
  if(!mainDiv) {return}
  if (!getCookie("role") || getCookie("role") === "none") {
    mainDiv.style.display = "block"
  } else {
    mainDiv.style.display = "none"
    //console.log("SESSION  " +  getCookie("role") + " IS ADMIN " + isAdminRole())
  }
  preInvoiceRefresh()
}  
function loginRequest(user, pass){
  const mainDiv = document.getElementById("main_div")
  displayLoading();
        axios
        .get("http://172.16.0.154:1234/validation?user="+user+"&pass="+pass)
        .then(function (response) {
         //console.log("DATA -- " +  JSON.stringify(response.data.role))
         hideLoading();
         setCookie("role",response.data.role,1)
          mainDiv.style.display = response.data.role === "admin" ? "block" : "none"
          sessionHandler()
          })
        .catch(function (error) {
          hideLoading();
          mainDiv.style.display = "block"
          //console.log(error);
          sessionHandler()
        });
    
}
function setCookie(name,value,days) {
  var expires = "";
  if (days) {
      var date = new Date();
     //date.setTime(date.getTime() + (days*24*60*60*1000));
     date.setTime(date.getTime() + (5*60*1000));
      expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
function eraseCookie(name) {   
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
function fetchProductList(){ 
  //displayLoading();
  axios
  .get("http://172.16.0.154:1234/product")
  .then(function (response) {
    ////console.log("DATA -- " +  JSON.stringify(response.data.products))
    hideLoading();
    productsList = response.data.products
    ReactDOM.render(
      ListProductSection()
     , document.getElementById("floating_list"));
     sessionHandler()
     displayCartList(cart.length > 0)
     inVoiceViewHandler(false)
    })
     
  .catch(function (error) {
    hideLoading();
    //console.log(error);
  });
 /* fetch('')
      .then(res => {
          res.json();
          //console.log( "RES > " + res.json())
          //console.log( res.json())
      })
      .then(res => {
        //console.log(res)
      });*/
}
function deleteProduct(product) {
   displayLoading();
  //console.log("DELETE --> " + JSON.stringify(product))
  axios.get('http://172.16.0.154:1234/delete_product?id='+product.id, {product})
  .then(function (response) {
    hideLoading();
    //console.log(" --> "+JSON.stringify(response));
    productsList = response.data.products
     ReactDOM.render(
      ListProductSection()
     , document.getElementById("floating_list"));
  })
  .catch(function (error) {
    hideLoading();
    //console.log(error);
  });
}
function updateProduct(product) {
  //console.log("PUT --> " + JSON.stringify(product))
  displayLoading();
  axios.put('http://172.16.0.154:1234/product', {product})
  .then(function (response) {   
    //console.log(" --> "+JSON.stringify(response));
    productsList = response.data.products
    ReactDOM.render(
      ListProductSection()
     , document.getElementById("floating_list")); 
         hideLoading();
  })
  .catch(function (error) {
    //console.log(error);
    hideLoading();
  });
}
function setNewProduct(product) {
  //console.log("POST --> " + JSON.stringify(product))
  displayLoading();
  axios.post('http://172.16.0.154:1234/product', {product})
  .then(function (response) {
    
    //console.log(response);
    productsList = response.data.products
    ReactDOM.render(
      ListProductSection()
     , document.getElementById("floating_list"));
      hideLoading();
  })
  .catch(function (error) {
    hideLoading();
    //console.log(error);
  });
}
function displayCartView(){

  

  ReactDOM.render(
    <div>
    {ListProductSection(cart,"cart")}
      </div>

   
   , document.getElementById("floating_cart_list"));
}
function onSearchInputChange(){
  const serachInput = document.getElementById("search_product_input")
  var data = productsList
  if (serachInput){
    const productItem = productsList.filter(obj => {
      return obj.code.toUpperCase().includes(serachInput.value.toUpperCase()) ||  obj.name_product.toUpperCase().includes(serachInput.value.toUpperCase());
    }); 
    data = productItem;
  }  
  //console.log("DATA FILTER SEARCH " + data.length)  
  ReactDOM.render(
    ListProductSection(data)
   , document.getElementById("floating_list"));
 //  ReactDOM.render(<ProductList products={data}/>, document.getElementById("list_container"));
}
function ListProductSection(data,type){
  //console.log("ListProductSection TYEP " + type)
  
  function isVisible() {
    switch (type) {
      case "cart":      
      //console.log("CARTS LENGHT " + cart.length )  
        return cart.length > 0;
        break;    
      default:
        return true;
        break;
    }
  }
  //console.log("IS VISIBLE CART " + isVisible())  
  return(
    <div style={isVisible() === true ? {display:"inline"} : {display:"none"}}>
        
        <input className='search_input' type="text"  style={type === "cart" ? {display:"none"} : {display:"inline"}} id="search_product_input"       placeholder='Busqueda...'  onChange={onSearchInputChange}></input>
        <ProductList  products={data} type={type}/>
      

       
     </div>
  );
}
 /* CHECK EXISTING PRODUCT  */
 function ifExitingProduct(value){
  for (var i = 0; i < productsList.length; i++) {
    if(productsList[i].code === value) {
    return productsList[i]
    }
  } 
  return undefined       
}
/* FILL INPUTS  2  */
function fillItems2(data, type){
  const code = document.getElementById("product_code") 
  const name = document.getElementById("product_name") 
  const aviability = document.getElementById("product_aviability") 
  const price = document.getElementById("product_price") 
  const sell_price = document.getElementById("product_sell_price")
 
  name.value = data.name_product  
  aviability.max = type === "sell" ? data.aviability : 300
  if(type !== "sell"){
    aviability.value =  data.aviability
  }
  price.value = data.price 
  sell_price.value = data.sell_price 
  name.disabled = type !== "new"
 //console.log("ITEMS FILLES " +  type + " NP " + data.name_product)
}
/* FILL INPUTS  */
function fillItems(data){
  const code = document.getElementById("product_code") 
  const name = document.getElementById("product_name") 
  const aviability = document.getElementById("product_aviability") 
  const price = document.getElementById("product_price") 
  const sell_price = document.getElementById("product_sell_price")
  code.value = data.code
  name.value = data.name_product
  if(modalType === "sell"){
    const productItem = productSell.filter(obj => {
      return obj.code === code.value;
    });
    var onCart = 0
    if(productItem){
      onCart =  productItem[0].qtty
    }
    aviability.max = data.aviability - onCart
    name.disabled = true

  } else if (modalType === "new"){
    name.disabled = false
    name.value = data.name_product
    price.value = data.price
  } else {
    name.value = data.name_product
    name.disabled = true
    price.value = data.price 
    aviability.value = data.aviability
    sell_price.value = data.sell_price
  }
 // aviability.value = data.aviability    
  sell_price.value =  data.sell_price

}

const displayLoading = () => {
  if(!loaderContainer) { 
    loaderContainer = document.querySelector('.loader-container');
  }
    //console.log("SHOW LOADER")
    loaderContainer.style.display = 'block';
  
};

const hideLoading = () => { 
  if(loaderContainer) {
  //console.log("HIDE LOADER")
  loaderContainer.style.display = 'none';
  } 
};

/* CLEAR INPUTS  */
function clearInputs(clearCode){
  const code = document.getElementById("product_code") 
  const name = document.getElementById("product_name") 
  const aviability = document.getElementById("product_aviability") 
  const price = document.getElementById("product_price") 
  const sell_price = document.getElementById("product_sell_price")
  
  if (code){
  code.value = clearCode === true ?  ""  : code.value
  name.value = "" 
  aviability.value = "" 
  price.value = "" 
  sell_price.value = ""
}
}

function displayModal(type){
  productSell = [];
  clearInputs(true)
  if(document.getElementById("product_exist")){
    document.getElementById("product_exist").style.display = "none"
  }
  
  switch (type) {
    case "sell":
      productToEdit = undefined;
      setModalType("sell")
      break;
      case "edit":
        setModalType("edit")
        break;
    default:
      productToEdit = undefined;
      setModalType("new")
      break;
  }
  updateButtonTitle()
  setModalShow(true)
  if(document.getElementById("cart_list")){
    ReactDOM.render(<CartView/>, document.getElementById("cart_list"));
  }

}
function updateButtonTitle(){
  switch (modalType) {
    case "sell":
      buttonTitle =  "VENDER"
      break;
    case "edit":
      buttonTitle =  "EDITAR"
      break;
    default:
      buttonTitle = "AGREGAR"
      break;
  }
}
function preInvoiceRefresh(){
  console.log("REFRESH INVOICE - CARTS ITEMS " + cart.length )
  if(document.getElementById("pre_invoice")){
    document.getElementById("pre_invoice").style.display = cart.length > 0 ? "inline" : "none"
    ReactDOM.render(<PreInvoice  className='pre_invoice' type={"cart"}/>, document.getElementById("pre_invoice"));
  }
  
}

function displayModeView(mode, product){
  setModalType(mode === "sell" ? "sell" : "new")
  console.log("DISPLAY MODE VIEW --> " + mode)
  if(mode === "sell" || mode === "new"){
      displayCartList(false)  
     displayProductList(false)
  }
  inVoiceViewHandler(false)
  if(document.getElementById("centered_container")){
    ReactDOM.render(<InpustProductView type={mode} product={product}/>, document.getElementById("centered_container"));
  }
}
function handlerAction(type){
  switch (type) {
    case "new":
      
     if(validateData().valid){
        const pdroductAtDb = productsList.filter(obj => {
          return obj.code ===  validateData().data.code;
        });
        //console.log("VALIDATED DATA " +  JSON.stringify(pdroductAtDb))
        if(pdroductAtDb.length > 0){
          const vData = validateData().data;
          //console.log("VALIDATED DATA  AVIS"  +typeof( validateData().data.aviability ) + " //  "  + typeof(pdroductAtDb[0].aviability))
          vData.aviability =  parseInt(pdroductAtDb[0].aviability) +  parseInt(validateData().data.aviability);
           //console.log("VALIDATED DATA  AVIS"  + ( validateData().data.aviability ) + " //  "  +  pdroductAtDb[0].aviability)
           updateProduct(vData)
        } else {
          setNewProduct(validateData().data)
        }      
     } else {
      alert("Debes completar todos los campos para agregar un nuevo producto");
     } 
     break;
    default:
      alert(type)
      break;
  }

}

/* INVOCE VIEW  */

function Invoice(props){
  var productQtt = 0;
  var totalSell = 0;
 // //console.log("PRE INVOICE TYPR " +  props.type)
 window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
  cart.forEach(function(itemCart) {
    productQtt = itemCart.qtty + productQtt;
    totalSell = totalSell + (parseFloat(itemCart.qtty)*parseFloat(itemCart.sell_price));
  })
  //console.log("PRE INVOICE DATA " ,  productQtt + " // " + totalSell)
  function SetDropdownPayment(){
    function myFunction() {
      document.getElementById("myDropdown").classList.toggle("show");
    }
    
    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }
    
    function paySelect(sender){
      document.getElementById("dropbtn").innerHTML = sender
       //console.log(sender)
    }

    
    return(
      <div className="dropdown dropdown_payment">
      <label  id="dropbtn" onClick={() => myFunction()} className="dropbtn">Tipo de pago</label>
      <div  id="myDropdown" class="dropdown-content">
      <label className='dtp_label' onClick={() => paySelect("Zelle")}>Zelle</label><br/>
      <label className='dtp_label' onClick={() => paySelect("Efectivo Bs")}>Efectivo Bs</label><br/>
      <label className='dtp_label' onClick={() => paySelect("Efectivo $")}>Efectivo $</label><br/>
      <label className='dtp_label' onClick={() => paySelect("Pago Movil / Transferencia")}>Pago Movil / Transferencia</label>
      </div>
    </div>
    );
  }
  function SetDropdownDelivery(){
    function myFunction() {
      document.getElementById("myDropdown_delivery").classList.toggle("show");
    }
    
    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }
    
    function deliverySelect(sender){
      document.getElementById("dropbtn_delivery").innerHTML = sender
        //console.log(sender)
    }
    return(
      <div className="dropdown">
      <label  id="dropbtn_delivery" onClick={() => myFunction()} className="dropbtn">Tipo de envío</label>
      <div id="myDropdown_delivery" class="dropdown-content">
      <label className='dtp_label' onClick={() => deliverySelect("Delivery")}>Delivery</label><br/>
      <label className='dtp_label' onClick={() => deliverySelect("Pick-Up")}>Pick-Up</label><br/>
      <label className='dtp_label' onClick={() => deliverySelect("En Tienda")}>En Tienda</label><br/>
      </div>
    </div>
    );
  }

  function currentDateTime(){
    return "Hora:" + new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
  }
  return(
    <div>
       <div  id='pre_invoic_content' className='pre_invoic_content'>
        <lu>
        <input type="text" id="client_name"   placeholder='Nombre del Comprador'></input> <br/>
        <input type="number" id="client_id"   placeholder='Número de Cédula'></input> <br/>
        <label className='product_qtty_l' >Cantidad de Productos: <strong style={{color:'green'}}> <br/>{productQtt} Unidades </strong></label><br/>
        <label className='product_qtty_l' >Venta Total: <strong style={{color:'green'}}> <br/>${totalSell}</strong></label>
        </lu>
        <label className='label_time'>{currentDateTime()}</label><br/>
        <SetDropdownPayment/>
        <SetDropdownDelivery/>
        </div>
    </div>
  );
}
/* PRE INVOICE */
function PreInvoice(props){
   
   
  function getInvoiceData(){
    
    return(
      <div id='pre_invoice' className='pre_invoice'> 
      <button className='cart_active_button' style={cart.length > 0 ? {display:"block"} : {display:"none"}} onClick={() => inVoiceViewHandler(true)}>&#x1F6D2;</button>
      
      </div>
    );
  }
  return(
    <div  >
    {getInvoiceData()}
    </div>
  );
}

function displayProductList(displayV){
  if(displayV === true){
    displayCartList(false)
  }
   const fList =  document.getElementById("floating_list")  
   sessionHandler();  
   //console.log("L " + fList + "SHOW LIST " + displayV)
   if(fList){
    fList.style.display = displayV === true ? "inline" : "none"
   }
}

function displayCartList(displayV){
  if(displayV === true){
    displayProductList(false)
  }
  const fList =  document.getElementById("floating_cart_list")  
  sessionHandler();  
  //console.log("L " + fList + "SHOW LIST " + displayV)
  if(fList){
   fList.style.display = displayV === true ? "inline" : "none"
  }
}


function validateData() {
  const product  = {
    "code": document.getElementById("product_code").value,
    "name_product":document.getElementById("product_name").value,
    "price":document.getElementById("product_price").value,
    "sell_price":document.getElementById("product_sell_price").value,
    "aviability": document.getElementById("product_aviability").value,
    "active": true
  }
  
  if (!product.code || !product.name_product || !product.price || !product.sell_price || !product.aviability){
    return {valid: false,
            data: product}
  }
  return {valid: true,
    data: product
  }
}

function onCodeInputChange(event){
    if(event.target.id !== "product_code"){ return }    
     const dataResult = ifExitingProduct(event.target.value);
     if (dataResult !== undefined) {
      //console.log("PRODUCT AT STORE  " + dataResult.name_product);
      if (modalType ===  "sell") {
        fillItems2(dataResult, "sell");
      } else {
        //displayModeView("edit",dataResult);
        fillItems2(dataResult, "edit");
      }
     } else {
      if (modalType !==  "sell") {
        displayModeView("new");
        document.getElementById("product_name").disabled = false;
      }
      clearInputs(false);
     }
    //document.getElementById("product_name").disabled = event === "edit" ||  event === "sell" 
}
function LoginPage(){
  function loginHandler(){
    const username = document.getElementById("username").value
    const password = document.getElementById("password").value
    if (!username) {
      alert("Debe agregar un usuario válido");
      return
    } else if (!password) {
      alert("Debe agregar una contraseña válido");
      return
    }
    loginRequest(username,password)
  }
  return(
    <div className='login_modal'>
      <label className='login_item'>Debe hacer login para<br/>interactuar con la página</label><br/><br/>
      <input type="text"   id="username"   placeholder='Usuario'></input> <br/>
      <input type="password"   id="password"    placeholder='Contraseña'></input> <br/>
    <button onClick={() => loginHandler()}>ENTRAR</button>
    </div>
  );
}
function inVoiceViewHandler(show){
  const iv = document.getElementById("invoice_m")
  const mainV = document.getElementById("centered_container")
  if(iv){
  iv.style.display = cart.length > 0 && show === true ?  "inline" : "none"
  if(mainV){
    mainV.style.display = show === true ?  "none" : "inline"
  }
  if(show === true){
    displayProductList(false)
  }
  ReactDOM.render(
    <Invoice/>
   , iv);
  }       
}

function KeylaApp() {
  fetchProductList();
  [modalType, setModalType] = useState("new");

  
  return(
    
    <div className="App">
      <div id="snackbar">Some text some message..</div>

    <div style={{display:"none"}} className="loader-container">
    <div className="loader"/>

    <div className="spinner"></div>
    </div>
    <div className='main_div' id='main_div'><LoginPage/></div>
    <header  className="App-header">
      <div id="pre_invoice">
      </div>
      
      <label>{getCookie("role")}</label><br/>
      <img   src={logo} className="App-logo logo" alt="logo" />
      <div className='add_product_content'>
        <button className="sell_product"  variant="primary"  onClick={() => displayCartList(true)} >&#x1F4E6;</button>
        <button className="sell_product"  variant="primary"  onClick={() => displayProductList(true)} >&#x1F4D1;</button>
        <button className="sell_product" variant="primary"  onClick={() => displayModeView("sell")} >&#x1F6CD;</button>
        <button className="add_product" variant="primary"  onClick={() => displayModeView("new")}>&#x1F5C3;</button>
      </div>
      <div id="centered_container">
      </div>
      <div id="invoice_m">
       
      </div>
       <div id="floating_list" className='floating_list' >

       </div>
       <div id="floating_cart_list" className="floating_cart_list"/>
     
    </header>
   
  </div>
  );
}


function InpustProductView(props){
  //console.log("PROPS AT INPUT " + JSON.stringify(props))
  clearInputs(false);
  return(
    <div>
      <label>{props.type == "new" ? "AGREGA UN NUEVO PRODUCTO" : props.type == "sell" ? "REGISTRA UNA NUEVA VENTA" : "EDITA UN PRODUCTO EXISTENTE"}</label><br/>
      <input type="text"   id="product_code"       placeholder='Código'  onChange={onCodeInputChange}></input> <br/>
      <input type="text"   id="product_name"       disabled={props.type === "sell" || props.type === "edit"}  placeholder='Nombre del pruducto' ></input> <br/>
      <input type="number" id="product_aviability" placeholder='Cantidad' min={1} max={props.type === "sell" ? props.product ? props.product.aviability : 1 : 300 } ></input> <br/>
      <input type="number" id="product_price"      placeholder='Precio de costo' style={ isAdminRole() !== true ? {display:"none"} : props.type === "new" || props.type === "edit" ? {display:"inline"} : {display:"none"}} ></input> <br/>
      <input type="number" id="product_sell_price" placeholder='Precio de venta' disabled={props.type === "sell" }  ></input> <br/>
      <input type="file" style={ props.type === "new" ? {display:"inline"} : {display:"none"}}></input> <br/>
      <button id='modal_done_button'  onClick={() => handlerAction(props.type)}>AGREGAR</button>
    </div>
  )
}
 
/*
STORED PLAYER  LIST 
*/

function ProductList(props) {

  
  var data = props.products !== undefined && props.products.length > 0 ? props.products : productsList;
  const listItems = data.map((d) => <div onClick={() => clickItemProduct(d)}><ProductItem product={d} type={props.type}/></div>);
////console.log("ACTIVE PLAYERS " + playersList.length);
  function clickItemProduct(item){
    //console.log("CLICK AT " + JSON.stringify(item))
    /*productToEdit = item;
    displayModal("edit");*/
  }

  return (
      <div>
      <button className="close_list_b" onClick={() => props.type === "cart" ? displayCartList(false) : displayProductList(false)}> ❌ </button>
      <div id="player_list_container" className='player_list'>     
      {listItems}
      <button style={props.type === "cart" ?  {display:"inline"} : {display:"none"}}>VENDER</button>
      </div>
    </div>
  );


}

function ProductItem(props) {
      function rentability(){
       const diff =  props.product.sell_price - props.product.price 
       if(diff <= 0){
        return "🤬"
       } else if (diff > props.product.price){
        return "💰"
       } else if (diff >= props.product.price*0.75){
        return "🤑"
       } else if (diff > props.product.price*0.5){
        return "😊"
       } else if (diff <= props.product.price*0.5 && diff <= props.product.price*0.25){
        return "😔"
       } else if (diff <= props.product.price*0.25){
        return "😫"
       }
       return "🤔 " + diff 
      }

      function addToCartHandler(product){
        const itemAtCart = cart.filter(obj => {
          return obj.id === product.id;
        });
        if(itemAtCart[0]){
          const objIndex = cart.findIndex((obj => obj.id == itemAtCart[0].id));

          cart[objIndex].qtty =  cart[objIndex].qtty + 1//  parseInt(product.qtty) ? parseInt(product.qtty) : 1
        } else {
          product.qtty = 1
          cart.push(product);
        }
        displayCartView();
        //console.log("CARTS ITEMS " + (cart.length > 0))
        //displayCartList(cart.length > 0)
        preInvoiceRefresh();
        showMessage(product.name_product + "<br/>Agregado a lista de compras!")
      }
      function clickDeleteProduct(product){
        const objIndex = cart.findIndex((obj => obj.id == product.id));
        //console.log("AT INDEZ -- " + objIndex)
        if(props.type === "cart"){
          if(product.qtty > 1) {
            cart[objIndex].qtty = cart[objIndex].qtty - 1
          } else if (product.qtty === 1) {
            cart.splice(objIndex,1); // first element removed
          }
          //console.log("CARTS ITEMS " + (cart.length > 0))
          displayCartList(cart.length > 0)
          displayCartView();
          preInvoiceRefresh();
          return 
        }
        if (window.confirm('Estas seguro de borrar ' + product.name_product + ' del inventario?\nEste paso es irreversible')) {
          deleteProduct(product);
          //console.log('Thing was saved to the database.');
        } else {
          // Do nothing!
          //console.log('Thing was not saved to the database.');
        }
      }
     return(
      <div className="list_item">
        <button className='delete_button' onClick={() => clickDeleteProduct(props.product)}>&#x1F5D1;</button>
        <button className='add_to_cart_button' onClick={() => addToCartHandler(props.product)} style={props.type === "cart" ? {display:"none"} : {display:"inline"}}>&#x1F6D2;</button>
        <label className='qtty_label' style={props.type === "cart" ? {display:"inline"} : {display:"none"}}> Cant {props.product.qtty}</label>
        <label className='product_label'>{props.product.name_product}</label> <label className='code_label'>Cod.{props.product.code}</label><br/><br/>
        <label className='aviability_label' style={props.product.aviability <= 5 ? {color:"red"} : {color:"green"}}>Disponibles: {props.product.aviability}</label><br/>
        <label style={ isAdminRole() !== true || props.type === "cart" ?  {display:"none"} : {display:"inline"} }>Costo: ${props.product.price}</label><br/>
        <label>Venta: ${props.product.sell_price}</label>
        <label style={props.type === "cart" ? {display:"none"} : {display:"inline"}} className='rentability_label'> {rentability()}</label>
      </div>
     );
}
 const CartView = (props) => {
  //console.log("ON CART  " + JSON.stringify(productSell))
  const cartItems = productSell.map((d) => <div className='cart_list'><label> <b>{d.product.name_product}</b><br/><b>Cant.</b>{d.qtty} <b>Precio:</b> ${d.qtty*d.product.sell_price}</label></div>);
   function totalCart(){
    var total = 0;
    productSell.forEach((item) => {
       total +=  item.product.sell_price*item.qtty;
    });
    return total;
   }
  return (
    <div>
    <label className='total_label' style={{display:(productSell.length > 0 ? "inline" : "none")}}>Total: ${totalCart()}</label>  
    {cartItems} 
    </div>
  );
};
 
//export default App;
export default KeylaApp;