<img src="https://github.com/Ecare-Exchange/Arells/blob/main/Art/General/Arells-Icon-Ebony.png" width="70px"> 

# [Arells](https://arells.com)
## Always sell Bitcoin for Profits.

Arells exists because it believes ***investors should always make profits selling assets***, especially during Bear Markets.

### Solution:
A Bitcoin marketplace that helps render bear markets obsolete. Arells is working on achieving this through an innovation called **HPM (Holding Price Mechanism)**.

## HPM
Holds the highest price after purchase limiting the erasure of its value thus introducing new mechanisms to help it achieve this feat:

### HPAP = Highest Price After Purchase

### Vatop = Value At Time Of Purchase
- **cVatop** = Corresponding Vatop
- **cVatopTa** = cVatop Token Amount
- **cpVatop** = Corresponding Price Vatop
- **cdVatop** = Corresponding Difference Vatop
- **acVatops** = All cVatops
- **acVatopTas** = All cVatopTas
- **acdVatops** = All cdVatops

### Vact = Value At Current Time
- **cVact** = Corresponding Vact
- **acVacts** = All cVacts
- **acVactsAts** = acVacts Available To Sell (combines cVacts only if the cVacts + (cVacts * .03 (or fee of Marketplace)))

#### Example:

1. Bitcoin Price: $60,000
 - $500 worth of Bitcoin is purchased
 - HPAP = $60,000
 - Vatop Group 1
 - - cVatop 1 = $500
 - - cVatopTa 1 = 0.00833 
 - - cpVatop 1 = $60,000
 - - cVact 1 = $500
 - - cdVatop 1 = $0
 - - - acVatops = $500
 - - - acVacts = $500
 - - - acdVatops = $0
 - - - AATS = $0

2. Bitcoin Price: $54,000
 - $600 worth of Bitcoin is purchased
 - HPAP = $60,000
 - Vatop Group 1
 - - cVatop 1 = $500
 - - cVatopTa 1 = 0.00833 
 - - cpVatop 1 = $60,000
 - - cVact 1 = $450 
 - - cdVatop 1 = -$50
 - Vatop Group 2
 - - cVatop 2 = $600
 - - cVatopTa 2 = 0.01111
 - - cpVatop 2 = $54,000
 - - cVact 2 = $600
 - - cdVatop 2 = $0
 - - - acVatops = $1,100
 - - - acVacts = $1,050
 - - - acdVatops = -$50
 - - - acVactsAts = $0

3. Bitcoin Price: $55,000
 - No Bitcoin is purchased
 - HPAP = $60,000
 - Vatop Group 1
 - - cVatop 1 = $500
 - - cVatopTa 1 = 0.00833 
 - - cpVatop 1 = $60,000
 - - cVact 1 = $458
 - - cdVatop 1 = -$42
 - Vatop Group 2
 - - cVatop 2 = $600
 - - cVatopTa 2 = 0.01111
 - - cpVatop 2 = $54,000
 - - cVact 2 = $611
 - - cdVatop 2 = $11
 - - - acVatops = $1,100
 - - - acVatopTas = 0.01941
 - - - acVacts = $1,069
 - - - acdVatops = -$31
 - - - acVactsAts = $611

4. Bitcoin Price: $65,000
 - $200 worth of Bitcoin is purchased
 - HPAP = $65,000
 - Vatop Group 1
 - - cVatop 1 = $500
 - - cVatopTa 1 = 0.00833 
 - - cpVatop 1 = $60,000
 - - cVact 1 = $542
 - - cdVatop 1 = $42
 - Vatop Group 2
 - - cVatop 2 = $600
 - - cVatopTa 2 = 0.01111
 - - cpVatop 2 = $54,000
 - - cVact 2 = $722
 - - cdVatop 1 = $122
 - Vatop Group 3
 - - cVatop 3 = $200
 - - cVatopTa 3 = 0.00308
 - - cpVatop 3 = $65,000
 - - cVact 3 = $200
 - - cdVatop 3 = $0
 - - - acVatops = $1,300
 - - - acVatopTas = 0.02249
 - - - acVacts = $1,464
 - - - acdVatops = $164 
 - - - acVactsAts = $1,264

5. Bitcoin Price: $63,000
 - $650 worth of Bitcoin is sold
 - HPAP = $65,000
 - Vatop Group 1
 - - cVatop 1 = $0
 - - cVatopTa 1 = 0
 - - cpVatop 1 = $0
 - - cVact 1 = $0
 - - cdVatop 1 = $0 
 - Vatop Group 2
 - - cVatop 2 = $450
 - - cVatopTa 2 = 0.00198
 - - cpVatop 2 = $54,000
 - - cVact 2 = $575
 - - cdVatop 2 = $125 
 - Vatop Group 3 
 - - cVatop 3 = $200
 - - cVatopTa 3 = 0.00308
 - - cpVatop 3 = $65,000
 - - cVact 3 = $194
 - - cdVatop 3 = -$6  
 - - - acVatops = $650
 - - - acVatopTas = 0.00506
 - - - acVacts = $769
 - - - acdVatops = $119 
 - - - acVactsAts = $575 

## This introduces a new kind of marketplace and market dynamics…

- **Solid Marketplace: an illiquid marketplace that constrains the flexibilities of buying and selling assets.**
- **Sloth Market: a market in which asset prices stagnate.**

<img src="https://github.com/Art-Sells/Arells/blob/3651d2883b9a4fce7076a4d14f89aae2d6a1be0e/Art/Marketing/BeforeandAfterArellss.jpg" width="800px"> 

### How It Works: https://arells.com/howitworks
_______________________________________________________________________

## FAQ:

***What if I'd like to sell my investment regardless of price?***
You'll be able to transfer your investment out of Arells and into other marketplaces and exchanges.

***How would transferring my finances out of Arells impact my investment?***
If the token price (outside the parameters of the Holding Price) decreases, the value of your investment will also decrease. The transfer fees of the network (whether it be Bitcoin, Ethereum or any other cryptocurrency) will be also be evident.

_______________________________________________________________________

## Roadmap

- **Oct 2022 - Nov 2022**
  - [X] Official Website *[[Complete]](https://arells.com)*----*arells.com* 

- **Oct 2022 - Mar 2023**
   - [X] Infrastructure *[[Dissolved into Arells]](https://github.com/Ecare-Exchange/infrastructure)*

- **Mar 2023 - May 2023**
  - [X] Prototype *[[Complete]](https://arells.com/prototype-seller-created)*----*arells.com/prototype-seller-created*
 
- **May 2023 - Dec 2023**
  - [X] Arells 1.0 *[[Complete]](https://arells.com)*
 
- **May 2024 - July 2024**
  - [ ] Arells Cryptocurrency Marketplace MVP *[[In-Development]](https://github.com/Art-Sells/Arells/commits/test)*

_______________________________________________________________________

## Core Beliefs:

Arells believes:
1. Investors should always make profits selling assets.
2. In empowering investors more than itself.
3. The love of money is the root to all evil, not money.
- This will keep Arells away from selfish ambition and towards creating innovations that will help empower investors more than itself.
