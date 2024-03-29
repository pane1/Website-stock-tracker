import React, { useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";

import { BsStarFill, BsStar } from "react-icons/bs";
import axios from "axios";
import Plot from "react-plotly.js";
import "./SearchPage.css"

import { isSchemaModelWithAttributes } from "@aws-amplify/datastore";
import scatter3d from "plotly.js/lib/scatter3d";

import { useAuth } from "../contexts/AuthContext"
import UserEntry from "./UserEntry";
import { useNavigate } from "react-router-dom"


function SearchPage(props) {
    useEffect(() => {
        document.title = "Search page"
    });

    //States 
    const [input, setInput] = useState({
        stock: ""
    });
    const [stockData, setStockData] = useState({
        symbol: "",
        name: "",
        price: [],
        volume: 0,
        avgVolume: 0,
        dividendVal: 0,
        dividendYield: 0,
        DividendDate: "",
        weekHigh: 0,
        weekLow: 0,
        weekAvg: 0
    });

    const [period, setPeriod] = useState([]);
    const [stockFound, setStatus] = useState(false);
    const [loading, setWait] = useState(false);
    const [visible, setVisible] = useState(false);

    const navigate = useNavigate();
    const { currentUser } = useAuth();

    //Variables
    const monthConv = ["Jan", "Feb", "Mar", "Apr", "May", "June", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


    /*Yahoo finance API*/
    const encodedParamsPrice = new URLSearchParams();
    encodedParamsPrice.append("symbol", input.stock);
    encodedParamsPrice.append("period", "30d");


    const optionsPrice = {
        method: 'POST',
        url: 'https://yahoo-finance97.p.rapidapi.com/price',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': '81416dfc25msh079e3fccfdd08acp13fbafjsnc50f816d72ed',
            'X-RapidAPI-Host': 'yahoo-finance97.p.rapidapi.com'
        },
        data: encodedParamsPrice
    };

    const encodedParamsInfo = new URLSearchParams();
    encodedParamsInfo.append("symbol", input.stock);

    const optionsInfo = {
        method: 'POST',
        url: 'https://yahoo-finance97.p.rapidapi.com/stock-info',
        headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'X-RapidAPI-Key': '81416dfc25msh079e3fccfdd08acp13fbafjsnc50f816d72ed',
            'X-RapidAPI-Host': 'yahoo-finance97.p.rapidapi.com'
        },
        data: encodedParamsInfo
    };
    //const [input, setInput] = useState("")

    function formInput(e) {
        //e.preventDefault();
        const { name, value } = e.target;
        setInput(() => ({ ...input, [name]: value.toUpperCase() }));
        console.log(input.stock);
        if (value == "") {
            setPeriod([]);
            setStockData({ symbol: "" });
            setStatus(false);
        }
        //setInput(e.target.value)
        //console.log(input);
    };

    async function searchStock(e) {
        e.preventDefault();
        try {
            var prices = [];
            var dates = [];
            //console.log(optionsInfo)
            //console.log(optionsPrice)
            setWait(true);
            await axios.request(optionsPrice).then(function (response) {

                if (typeof response.data.data[0] !== "undefined") {
                    console.log("Stock pricing", response.data);

                    for (var i = 0; i < response.data.data.length; i++) {
                        prices.push(response.data.data[i].Close);
                        var t = new Date(response.data.data[i].Date);
                        let month = t.getMonth();
                        let day = t.getDate();
                        dates.push(`${monthConv[month]}/${day}`)
                    }
                    //setStockData(() => ({ price: prices, symbol: input.stock }));
                    setPeriod(dates);

                    //console.log(dates)
                }
                else {
                    console.log("stock pricing not found");

                }

            }).catch(function (error) {
                console.error(error);
            })

            await axios.request(optionsInfo).then(function (response) {
                if (response.data.data != null) {
                    console.log("Stock info", response.data.data);
                    setStatus(true);

                    var longName = response.data.data.longName;
                    var vol = response.data.data.volume;
                    var avgVol = response.data.data.averageVolume;
                    var divVal = response.data.data.lastDividendValue;
                    var t = new Date(response.data.data.exDividendDate * 1000);
                    let month = t.getMonth();
                    let day = t.getDate();
                    let year = t.getFullYear();

                    //console.log(t, month, day, typeof year)
                    var divDate = (`${monthConv[month]}/${day}/${year}`);
                    var divYield = response.data.data.dividendYield;
                    var high = response.data.data.fiftyTwoWeekHigh;
                    var low = response.data.data.fiftyTwoWeekLow;
                    var avg = response.data.data.fiftyDayAverage;


                    setStockData({
                        price: prices,
                        name: longName,
                        symbol: input.stock,
                        volume: vol,
                        avgVolume: avgVol,
                        dividendVal: divVal,
                        dividendYield: divYield,
                        DividendDate: divDate,
                        weekHigh: high,
                        weekLow: low,
                        weekAvg: avg
                    });

                    //console.log(stockData);
                    //console.log(input);
                }
                else {
                    setStatus(false);
                    console.log("Stock cannot be displayed.")
                    alert("Stock cannot be displayed.");

                }

            }).catch(function (error) {
                console.error(error);
                console.log("Stock info cannot be found.");
                alert("Stock info cannot be found.");
            })

        }
        catch (error) {
            console.log("Search could not be done.")
            alert("Search could not be done.")
        }
        setWait(false);

    };

    function closeWindow() {
        setVisible(false);
    };
    function openWindow() {
        setVisible(true);
    }

    async function favorite(userData) {

        try {
            let newUser = {
                Uid: currentUser.uid,
                Symbol: stockData.symbol,
                buyPrice: userData.buyPrice,
                sellPrice: userData.sellPrice,
                buyDate: userData.buyDate == "N/A" ? "N/A" : userData.buyDate,
                sellDate: userData.sellDate == "N/A" ? "N/A" : userData.sellDate,
            };
            console.log(newUser);
            setWait(true);
            await axios.post("http://localhost:3001/stock-addition", newUser)
                .then(res => {
                    if (res.data == "stock already in collection") {
                        alert("stock already in collection");
                    }
                    else {
                        console.log(res.data)
                        setVisible(false);
                        navigate("/");
                    }
                });

        }
        catch (error) {
            console.log(error);
        }
        setWait(false);
    };

    function getUsersValues(userData) {
        console.log(userData)
        /*
        setUserData({
            Uid: currentUser.uid,
            symbol: stockData.symbol,
            buyPrice: userData.buyPrice,
            sellPrice: userData.sellPrice,
            buyDate: userData.buyDate,
            sellDate: userData.sellDate
        })
        */
        favorite(userData)
    }
    return (
        <div className="search-container" style={{ cursor: loading ? "wait" : "auto" }}>
            <div className="search-content">
                <div className="search-area">
                    <form onSubmit={searchStock} className="search-bar-form">
                        <input
                            //ref={inputRef}
                            onChange={formInput}
                            className="search-bar"
                            name="stock"
                            placeholder="Search for a stock"
                        />
                    </form>
                    <div className="search-button" disable={loading.toString()} onClick={searchStock}>
                        <FiSearch className="search-icon" style={{ cursor: loading ? "wait" : "pointer" }}></FiSearch>
                    </div>
                </div>
                <div className="search-result-area">
                    {stockFound != "" &&
                        <div className="stock-graphContent">
                            <div className="stock-titleBarArea">
                                <div className="stock-titleBarText">
                                    <p className="stock-nameText">{stockData.symbol} - {stockData.name}</p>
                                </div>
                                <div onClick={openWindow} className="stock-titleBarIcon">
                                    <BsStar className="stock-favoriteIcon"></BsStar>
                                </div>
                            </div>
                            <Plot className="stock-graph"
                                data={[{
                                    x: period,
                                    y: stockData.price,
                                    type: 'scatter',
                                    mode: 'lines+markers',
                                    marker: { color: 'blue' }
                                }]}
                                layout={{
                                    width: 960,
                                    height: 480,

                                    yaxis: {
                                        title: "Cost (USD $)",
                                        titlefont: {
                                            family: 'Calibri (Body)',
                                            size: 18,
                                            color: '#828282'
                                        },

                                    }
                                }}
                            />
                            <div className="stock-details">
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">Volume:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">{stockData.volume}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">Average Volume:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">{stockData.avgVolume}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">Dividend Yield:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">{stockData.dividendYield}</p>
                                    </div>

                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">52-week Average:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">${stockData.weekAvg}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">52-week High:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">${stockData.weekHigh}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">52-week Low:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">${stockData.weekLow}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">Last Dividend Amount:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">${stockData.dividendVal}</p>
                                    </div>
                                </div>
                                <div className="stock-tab">
                                    <div className="table-label">
                                        <p className="table-textLeft">Ex-Dividend Date:</p>
                                    </div>
                                    <div className="table-value">
                                        <p className="table-textRight">{stockData.DividendDate}</p>
                                    </div>
                                </div>

                            </div>
                        </div>
                    }
                </div>

            </div>
            {visible && <UserEntry getUsersValues={getUsersValues} closeWindow={closeWindow} />}
        </div >
    );
}

export default SearchPage;