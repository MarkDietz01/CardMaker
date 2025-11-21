using System;
using System.IO;
using System.Windows;

namespace CardMaker.Desktop;

public partial class MainWindow : Window
{
    private const string WebRoot = "wwwroot";

    public MainWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        try
        {
            await CardView.EnsureCoreWebView2Async();
            var indexPath = Path.Combine(AppContext.BaseDirectory, WebRoot, "index.html");
            CardView.Source = new Uri(indexPath);
        }
        catch (Exception ex)
        {
            MessageBox.Show($"Kon CardMaker UI niet laden: {ex.Message}", "CardMaker Studio", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
}
