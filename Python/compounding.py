#This is a simple python file that takes user inputs and calculate total interest

def calcInterest(principal:float, interest_rate:float, time_period:float, frequency:float):
    amount = principal * (1 + (interest_rate / frequency)) ** (frequency * time_period)
    interestAmt = amount - principal
    return interestAmt


# Take user inputs

principal = float(input("Enter the principal amount: "))

interest_rate = float(input("Enter the interest rate as a decimal: "))

time_period = float(input("Enter the time blah blah period: "))

compounding_freq = float(input("Enter compounding frequ3ency in  bats: "))

totalInterest = calcInterest(principal, interest_rate, time_period, compounding_freq)

print("Total interest accured during", time_period, "years at", (interest_rate * 100), "% will be: $", round(totalInterest, 2))