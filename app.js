// requiring packages__> express,EJS,bodyParser
require('dotenv').config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");


const { get } = require("express/lib/response");
const res = require("express/lib/response");

//Creting a NOde app by the below command
const app=express();
const PORT = process.env.PORT || 3000;


//seiing view engine with ejs for adding my first templlate

//==================================IMPORTANT !!!!!!+======================

//IN ORDER TO USE EJS WE HAVE TO  CREATE A """"views""""" FOLDER
//  BECAUSE VIEW ENGINE IS LOOKING FOR THAT FOLDER IN WHICH 
// WE R KEEPING FILES TO BE RENDERED

app.set('view engine', 'ejs');

//bodyparser allows to retrive the form input 
// into the javascript by req.body.nameOfTheFormInput
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// connectiing to mongoDB using moongoose
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser: true});

//creating a schema for items(which has one field{name:String})
const itemsSchema=new mongoose.Schema({
  name: String
});

// creating a model for itemSchema
const Item =mongoose.model('Item',itemsSchema);

//creating some instaces of default item
const item1=new Item({
  name: "Welcome to your toDOList!"
}) ;
const item2=new Item({
  name:"Hit the + button to add a new item"
}) ;
const item3=new Item({
  name:"<-- Hit this  to delete an item."
}) ;

//creating a array to store the items
const defaultItems=[item1,item2,item3];

// schema for random route after extracted from req.params

const listSchema=({
  name: String,
  items: [itemsSchema]
});

// creating a model for listSchema
const List=mongoose.model("List",listSchema);

// home page get request 
app.get("/", function(req, res) {


  //find fuction for accesing mongoDB collections and send them to the website using EJS
  Item.find({})
  .then((foundItems)=>{//here "then" catches the whole collection ,in this case catches "items"collection
    
  if(foundItems.length == 0) {

    // Inserting deafult items of array to the schema in mongoDB
    Item.insertMany(defaultItems)
    .then(function(savedItems) {
      console.log('Items saved successfully:', savedItems);
    })
    .catch(function(error) {
      console.error('Error saving items:', error);
    });

    res.redirect("/");
  }  
  else{

    //value of listTitle and newListItems will be passed
    //  into list.ejs and passed values will be placed 
    // correspoding to the variable 

    res.render("list", {listTitle: "Today", newListItems: foundItems});


  }
  })
  .catch((err)=>{

   console.log(err);
   });



});

app.get("/:customListName", function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName})
  .then((foundList)=>{
    if(!foundList){//checks if the list item already exiest if exiests print exist
      console.log("Does not exiest!");
      //list item does not exiest so create new
      const list=new List({
        name:customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    }
    else{
      console.log("Exiest!");
      res.render("list",{listTitle:foundList.name, newListItems: foundList.items});
    
    }
    });

  
  
  

});

//post method catches the request from the html from 
// where i define action="/",method=post
// it handles custom lists that are created and redirect to the 
// corresponding  path or page
app.post("/", function(req, res){

  //  gets the input text
  const itemName = req.body.newItem;
  //corresponding listTitle is returned
  const listName= req.body.list;
  const item=new Item({
    name: itemName
  });

  if(listName==" Today "){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({ name:listName })
    .then( foundList=> {
      if(!foundList){
        item.save();
        res.redirect("/");
      }else{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
     }
      
    })
    .catch(error=>{
      console.log(error);
    });
  }
});

//this post method handle the upcoming request from the checkbox trigered
// in the list.ejs ,when the checkbox is slected.
// when the checkbox is selected the list ite, must be removed.
app.post("/delete",function(req,res){
  const checkedItemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName=="Today"){

    Item.findByIdAndRemove(checkedItemId)
    .then(result=>{
      console.log("deleted");
    });
    res.redirect("/");
  
  }
  else{
   List.findOneAndUpdate({name:listName},{$pull: {items: {_id: checkedItemId}}})
   .then(foundList=>{
      res.redirect("/" + listName);
    });
  }
  
  
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
  console.log("Server started on port 3000");
});
