import pandas as pd


df = pd.read_csv("C:/Users/smara/OneDrive - University of Cincinnati/DataVis-Project-2/Project 2/data/cincy311_cleaned.tsv", sep='|', header=0)

df_2021 = df[df['updated_datetime'].str.contains("2021")]

df_2021.to_csv('C:/Users/smara/OneDrive - University of Cincinnati/DataVis-Project-2/Project 2/data/cincy311_cleaned_2021.tsv', sep='|')
